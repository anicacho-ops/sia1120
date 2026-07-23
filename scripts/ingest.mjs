// 지식베이스 색인 스크립트
// PDF → 페이지별 텍스트 추출 → 청킹 → OpenAI 임베딩 → Supabase document_chunks 저장
//
// 실행: node scripts/ingest.mjs
// 필요 환경변수(.env.local): OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── .env.local 로드 ──────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {}
  return env;
}
const env = loadEnv();
const OPENAI_API_KEY = env.OPENAI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMBED_MODEL = env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON) {
  console.error("환경변수 누락: OPENAI_API_KEY / SUPABASE_URL / ANON_KEY 확인");
  process.exit(1);
}

// ── 색인할 문서 정의 ─────────────────────────────────────────
const DOCS = [
  {
    file: "2026년도 의료관련감염병 관리지침(전자용) (1).pdf",
    title: "2026년도 의료관련감염병 관리지침",
    sourceType: "KDCA",
    category: "감염관리체계",
    revisedAt: "2026-01-01",
  },
  {
    file: "의료관련감염+표준예방지침서(웹용-수정-20190712).pdf",
    title: "의료관련감염 표준예방지침",
    sourceType: "KDCA",
    category: "감염관리체계",
    revisedAt: "2019-07-12",
  },
  {
    file: "투약준비+관련+감염관리+권고안(중소·요양병원)_전자용.pdf",
    title: "투약준비 관련 감염관리 권고안 (중소·요양병원)",
    sourceType: "KDCA",
    category: "올바른 세척과 소독",
    revisedAt: "2023-01-01",
  },
];

// ── 텍스트 정제: 널 문자·제어문자 제거 (Postgres 저장 불가 문자) ──
function sanitize(s) {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0);
    // 탭(9)·개행(10)·복귀(13)은 유지, 그 외 0x00~0x1F, 0x7F 제어문자 제거
    if (code === 9 || code === 10 || code === 13 || code >= 32) out += ch;
  }
  return out;
}

// ── 청킹: 목표 길이로 자르고 오버랩 ──────────────────────────
const CHUNK_CHARS = 1200; // 한국어 기준 대략 500~700 토큰
const OVERLAP = 200;

function chunkText(text) {
  const clean = sanitize(text)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length <= CHUNK_CHARS) return clean ? [clean] : [];
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_CHARS, clean.length);
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf("다. "),
        slice.lastIndexOf("\n\n"),
      );
      if (lastBreak > CHUNK_CHARS * 0.5) end = start + lastBreak + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece.length > 30) chunks.push(piece);
    start = end - OVERLAP;
    if (start < 0) start = 0;
    if (end >= clean.length) break;
  }
  return chunks;
}

// ── OpenAI 임베딩 (배치) ─────────────────────────────────────
async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI 임베딩 실패 ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

// ── Supabase 저장 ────────────────────────────────────────────
async function insertChunks(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/document_chunks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase 저장 실패 ${res.status}: ${t.slice(0, 300)}`);
  }
}

async function upsertDocument(doc) {
  // 같은 제목 문서가 있으면 재사용(업데이트+청크삭제), 없으면 생성 → id 반환 (재실행 안전)
  const enc = encodeURIComponent(doc.title);
  const found = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?select=id&title=eq.${enc}`,
    {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    },
  ).then((r) => r.json());

  const payload = {
    title: doc.title,
    source_type: doc.sourceType,
    category: doc.category,
    revised_at: doc.revisedAt,
    status: "APPROVED",
    uploaded_by: "색인 스크립트",
    approved_by: "색인 스크립트",
    approved_at: new Date().toISOString(),
  };

  if (Array.isArray(found) && found.length > 0) {
    const id = found[0].id;
    await fetch(`${SUPABASE_URL}/rest/v1/document_chunks?document_id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        Prefer: "return=minimal",
      },
    });
    await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    return id;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`documents 등록 실패 ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return json[0].id;
}

async function updateChunkCount(docId, count) {
  await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${docId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ chunk_count: count }),
  });
}

// ── 메인 ─────────────────────────────────────────────────────
async function main() {
  console.log("지식베이스 색인 시작\n");
  let grandTotal = 0;

  for (const doc of DOCS) {
    console.log(`📄 ${doc.title}`);
    const parser = new PDFParse({
      data: readFileSync(join(ROOT, "knowledge_base", doc.file)),
    });
    const result = await parser.getText();
    await parser.destroy();

    // 페이지 분리: "-- N of M --" 마커 기준
    const pages = result.text.split(/--\s*\d+\s*of\s*\d+\s*--/);
    const docId = await upsertDocument(doc);

    const items = [];
    pages.forEach((pageText, i) => {
      for (const c of chunkText(pageText)) {
        items.push({ content: c, pageNo: i });
      }
    });
    console.log(`  청크 ${items.length}개 생성, 임베딩·저장 중...`);

    const BATCH = 64;
    let chunkIndex = 0;
    for (let b = 0; b < items.length; b += BATCH) {
      const batch = items.slice(b, b + BATCH);
      const embeddings = await embedBatch(batch.map((x) => x.content));
      const rows = batch.map((x, j) => ({
        document_id: docId,
        document_title: doc.title,
        source_type: doc.sourceType,
        category: doc.category,
        page_no: x.pageNo,
        chunk_index: chunkIndex++,
        content: x.content,
        embedding: embeddings[j],
        token_count: Math.round(x.content.length / 2),
      }));
      await insertChunks(rows);
      process.stdout.write(`  ${Math.min(b + BATCH, items.length)}/${items.length}\r`);
    }
    await updateChunkCount(docId, items.length);
    grandTotal += items.length;
    console.log(`  ✅ ${items.length}개 저장 완료          \n`);
  }

  console.log(`🎉 전체 완료: 총 ${grandTotal}개 청크 색인됨`);
}

main().catch((e) => {
  console.error("\n색인 실패:", e.message);
  process.exit(1);
});
