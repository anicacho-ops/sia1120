// RAG 채팅 API
// 질문 → 임베딩 → 벡터 검색(match_chunks) → GPT 답변 생성(출처 포함, 스트리밍)
// 근거(청크)가 임계값 미만이면 답변을 생성하지 않고 폴백 안내를 반환합니다 (PRD 핵심 원칙).

import { NextRequest } from "next/server";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const TOP_K = Number(process.env.RAG_TOP_K || 5);
const THRESHOLD = Number(process.env.RAG_SCORE_THRESHOLD || 0.3);

interface Hit {
  document_title: string;
  source_type: string;
  category: string | null;
  page_no: number | null;
  content: string;
  similarity: number;
}

const FALLBACK =
  "죄송합니다. 현재 승인된 지침에서 이 질문에 답할 근거를 찾지 못했습니다. 정확한 안내를 위해 감염관리실에 문의해 주세요.";

// 개별 환자 진단·처방 차단용 간단 의도 분류 (키워드 기반)
function isBlockedIntent(q: string): boolean {
  const patterns = [
    /이\s*환자.*(항생제|처방|약|치료)/,
    /(우리|저희)?\s*환자.*(뭐|무엇|어떤).*(쓸|처방|투여)/,
    /처방.*해\s*줘/,
  ];
  return patterns.some((re) => re.test(q));
}

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`embedding failed: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding;
}

async function search(queryEmbedding: number[]): Promise<Hit[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_chunks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON!,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify({
      query_embedding: queryEmbedding,
      match_threshold: THRESHOLD,
      match_count: TOP_K,
    }),
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON) {
    return new Response(
      sse("error", { message: "서버 환경변수가 설정되지 않았습니다." }),
      { headers: { "Content-Type": "text/event-stream" } },
    );
  }

  const { content, history } = (await req.json()) as {
    content: string;
    history?: { role: string; content: string }[];
  };
  const started = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: string, d: unknown) =>
        controller.enqueue(encoder.encode(sse(e, d)));

      try {
        // 1) 의도 차단
        if (isBlockedIntent(content)) {
          const msg =
            "개별 환자의 진단·처방에 대한 질문은 답변하지 않습니다. 담당 주치의와 상의해 주세요.";
          for (const ch of msg) send("token", { text: ch });
          send("done", {
            is_blocked: true,
            is_fallback: false,
            latency_ms: Date.now() - started,
          });
          controller.close();
          return;
        }

        // 2) 검색
        const queryEmbedding = await embed(content);
        const hits = await search(queryEmbedding);

        // 3) 근거 부족 → 폴백
        if (hits.length === 0) {
          for (const ch of FALLBACK) send("token", { text: ch });
          send("done", {
            is_fallback: true,
            is_blocked: false,
            latency_ms: Date.now() - started,
          });
          controller.close();
          return;
        }

        // 4) 인용 정보 준비
        const citations = hits.map((h, i) => ({
          index: i + 1,
          documentTitle: h.document_title,
          section: h.category ?? "",
          page: h.page_no ?? 0,
          revisedAt: "",
          snippet: h.content.slice(0, 200),
          sourceType: h.source_type,
          similarity: h.similarity,
        }));

        const context = hits
          .map((h, i) => `[${i + 1}] (${h.document_title}) ${h.content}`)
          .join("\n\n");

        const system = `당신은 의료기관 감염관리 Q&A 도우미 '시아'입니다.
아래 '근거 자료'에 있는 내용만 사용해 한국어로 답하세요.
규칙:
- 근거에 없는 내용은 절대 지어내지 마세요. 근거가 부족하면 "감염관리실에 문의해 주세요"라고 답하세요.
- 답변 문장에 근거 번호를 [1], [2] 형식으로 표시하세요.
- 개별 환자의 진단·처방은 답하지 말고 담당의 상담을 안내하세요.
- 간결하고 명확하게, 필요하면 목록으로 정리하세요.

근거 자료:
${context}`;

        // 5) GPT 스트리밍
        const messages = [
          { role: "system", content: system },
          ...(history ?? []).slice(-8),
          { role: "user", content },
        ];

        const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: CHAT_MODEL,
            messages,
            temperature: 0.2,
            stream: true,
          }),
        });

        if (!gptRes.ok || !gptRes.body) {
          throw new Error(`GPT 호출 실패: ${gptRes.status}`);
        }

        const reader = gptRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) send("token", { text: delta });
            } catch {
              // 부분 청크 무시
            }
          }
        }

        // 6) 출처 + 완료
        send("citations", { citations });
        send("done", {
          is_fallback: false,
          is_blocked: false,
          latency_ms: Date.now() - started,
        });
        controller.close();
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "알 수 없는 오류",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
