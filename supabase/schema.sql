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
