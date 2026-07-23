import type { Message } from "@/lib/types";
import { Fragment } from "react";

// 답변 본문의 [n] 인용 마커를 칩으로 렌더링
function renderWithCitations(content: string) {
  const parts = content.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      return (
        <sup
          key={i}
          className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary-soft px-1 text-[10px] font-bold text-primary-hover"
        >
          {m[1]}
        </sup>
      );
    }
    // 줄바꿈 보존
    return (
      <Fragment key={i}>
        {part.split("\n").map((line, j, arr) => (
          <Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-hover">
        시
      </div>
      <div className="min-w-0 flex-1">
        {message.isBlocked && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-1 text-xs font-medium text-danger">
            ⚠ 개별 환자 진단·처방 문의는 답변 대상이 아닙니다
          </div>
        )}
        {message.isFallback && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
            근거 문서를 찾지 못해 폴백 응답을 반환했습니다
          </div>
        )}
        <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm leading-relaxed shadow-sm ring-1 ring-border">
          {renderWithCitations(message.content)}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <span
                key={c.index}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted"
                title={c.snippet}
              >
                <span className="font-bold text-primary-hover">[{c.index}]</span>
                {c.documentTitle} · {c.section}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          {message.latencyMs && <span>응답 {(message.latencyMs / 1000).toFixed(1)}초</span>}
          <button className="hover:text-success">👍 도움돼요</button>
          <button className="hover:text-danger">👎 부정확</button>
          <button className="hover:text-warning">➖ 불충분</button>
        </div>
      </div>
    </div>
  );
}
