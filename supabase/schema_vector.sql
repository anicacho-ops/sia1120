-- 시아 (icqa) — 지식베이스 벡터 검색 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- OpenAI text-embedding-3-small = 1536 차원 기준.

-- 1) pgvector 확장 활성화
create extension if not exists vector;

-- 2) 문서 청크(문단) 테이블
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  document_title text not null,
  source_type text not null default 'INTERNAL',
  category text,
  page_no int,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  token_count int,
  created_at timestamptz not null default now()
);

-- 3) 벡터 유사도 인덱스 (코사인)
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4) 프로토타입: RLS 비활성 + anon 권한
alter table public.document_chunks disable row level security;
grant select, insert, update, delete on public.document_chunks to anon;

-- 5) 유사도 검색 함수 (RAG용)
--    query_embedding 과 가까운 청크를 관련도 순으로 반환.
--    match_threshold 미만은 제외 (근거 부족 시 폴백 처리에 사용).
create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.2,
  match_count int default 5
)
returns table (
  id uuid,
  document_title text,
  source_type text,
  category text,
  page_no int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_title,
    dc.source_type,
    dc.category,
    dc.page_no,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_chunks(vector, float, int) to anon;
