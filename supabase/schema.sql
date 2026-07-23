-- 시아 (icqa) — 회원 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- ⚠ 프로토타입 설정: RLS 없이 anon key로 직접 접근합니다.
--    운영 전 반드시 Supabase Auth + RLS로 전환하세요.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  department text,
  employee_no text,
  password_hash text not null,
  role text not null default 'USER' check (role in ('USER', 'ICP', 'ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- 요청에 따라 RLS 비활성화 (프로토타입 전용)
alter table public.users disable row level security;

grant usage on schema public to anon;
grant select, insert, update on public.users to anon;

-- ─────────────────────────────────────────────────────────────
-- 참조문헌 (지침 문서) 테이블 — 문서 관리 화면에서 업로드 시 저장
-- PRD 섹션 6 Document 모델 기반
-- ─────────────────────────────────────────────────────────────

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null default 'INTERNAL'
    check (source_type in ('INTERNAL', 'KDCA', 'INTERNATIONAL', 'ICCON', 'FAQ')),
  category text,
  version int not null default 1,
  status text not null default 'IN_REVIEW'
    check (status in ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED')),
  file_name text,
  revised_at date,
  uploaded_by text,
  approved_by text,
  approved_at timestamptz,
  chunk_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.documents disable row level security;
grant select, insert, update on public.documents to anon;
