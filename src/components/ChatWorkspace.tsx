"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChatSession, Message } from "@/lib/types";
import { sessions as seedSessions } from "@/lib/mock";
import { getSessionUser, signOut, type SessionUser } from "@/lib/auth";
import { MessageBubble } from "./MessageBubble";
import { SourcePanel } from "./SourcePanel";

export function ChatWorkspace() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>(seedSessions);
  const [activeId, setActiveId] = useState<string>(seedSessions[0].id);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];
  const lastAssistant = [...active.messages]
    .reverse()
    .find((m) => m.role === "ASSISTANT");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [active.messages.length, streaming]);

  function updateActive(fn: (s: ChatSession) => ChatSession) {
    setSessions((prev) => prev.map((s) => (s.id === activeId ? fn(s) : s)));
  }

  function newSession() {
    const id = `s${Date.now()}`;
    const fresh: ChatSession = {
      id,
      title: "새 질문",
      isFavorite: false,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(id);
  }

  function toggleFavorite(id: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)),
    );
  }

  // 특정 세션의 어시스턴트 메시지 갱신 헬퍼
  function patchMessage(
    sessionId: string,
    messageId: string,
    patch: Partial<Message>,
  ) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, ...patch } : m,
              ),
            },
      ),
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const sessionId = activeId;
    const userMsg: Message = {
      id: `u${Date.now()}`,
      role: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `a${Date.now()}`;

    // 최근 대화 맥락 (직전까지의 메시지)
    const history = active.messages.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    }));

    updateActive((s) => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 24) : s.title,
      messages: [
        ...s.messages,
        userMsg,
        {
          id: assistantId,
          role: "ASSISTANT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    setStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, history }),
      });
      if (!res.ok || !res.body) throw new Error(`요청 실패: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const lines = evt.split("\n");
          const eventType = lines
            .find((l) => l.startsWith("event:"))
            ?.slice(6)
            .trim();
          const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!eventType || !dataLine) continue;
          const data = JSON.parse(dataLine);

          if (eventType === "token") {
            acc += data.text;
            patchMessage(sessionId, assistantId, { content: acc });
          } else if (eventType === "citations") {
            patchMessage(sessionId, assistantId, { citations: data.citations });
          } else if (eventType === "done") {
            patchMessage(sessionId, assistantId, {
              latencyMs: data.latency_ms,
              isFallback: data.is_fallback,
              isBlocked: data.is_blocked,
            });
          } else if (eventType === "error") {
            patchMessage(sessionId, assistantId, {
              content:
                "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
              isFallback: true,
            });
          }
        }
      }
    } catch {
      patchMessage(sessionId, assistantId, {
        content: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        isFallback: true,
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* 세션 사이드바 */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            시
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">시아</p>
            <p className="text-[11px] leading-tight text-muted">감염관리 Q&amp;A</p>
          </div>
        </div>

        <div className="px-3">
          <button
            onClick={newSession}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            + 새 질문
          </button>
        </div>

        <nav className="scroll-thin mt-3 flex-1 overflow-y-auto px-2">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase text-muted">
            대화 이력
          </p>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                s.id === activeId
                  ? "bg-primary-soft text-primary-hover"
                  : "text-foreground/80 hover:bg-surface-2"
              }`}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(s.id);
                }}
                className={s.isFavorite ? "text-warning" : "text-muted/40"}
              >
                ★
              </span>
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/admin"
            className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground/80 transition hover:bg-surface-2"
          >
            ⚙ 관리자
          </Link>
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name ?? "…"}
              </p>
              <p className="truncate text-[11px] text-muted">
                {user ? `${user.department ?? "소속 미지정"} · ${user.role}` : ""}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="로그아웃"
              className="rounded-md px-1.5 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-danger"
            >
              나가기
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 채팅 영역 */}
      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
          <div>
            <h1 className="text-sm font-semibold">{active.title}</h1>
            <p className="text-[11px] text-muted">
              근거 없는 답변은 제공하지 않으며, 모든 답변에 출처를 표시합니다.
            </p>
          </div>
        </header>

        <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {active.messages.length === 0 ? (
              <EmptyState onPick={(q) => setInput(q)} />
            ) : (
              active.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))
            )}
          </div>
        </div>

        {/* 입력 */}
        <div className="border-t border-border bg-surface px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/30">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="감염관리 지침에 대해 질문하세요. (예: CRE 환자 격리 해제 기준은?)"
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted"
              />
              <button
                onClick={send}
                disabled={streaming || !input.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-40"
              >
                {streaming ? "생성 중" : "전송"}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">
              개별 환자의 진단·처방은 답변하지 않습니다. 환자 식별정보는 저장되지 않습니다.
            </p>
          </div>
        </div>
      </main>

      {/* 출처 패널 */}
      <SourcePanel citations={lastAssistant?.citations ?? []} />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const examples = [
    "CRE 환자 격리 해제 기준이 어떻게 되나요?",
    "손위생 5 moments 내용 알려줘",
    "활동성 결핵 의심 환자 병실 배정 방법은?",
    "N95 마스크 밀착도 검사 주기는?",
  ];
  return (
    <div className="mx-auto max-w-xl pt-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
        시
      </div>
      <h2 className="mt-4 text-lg font-semibold">무엇을 도와드릴까요?</h2>
      <p className="mt-1 text-sm text-muted">
        승인된 감염관리 지침을 근거로 출처와 함께 답변합니다.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {examples.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-foreground/80 transition hover:border-primary hover:text-primary-hover"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
