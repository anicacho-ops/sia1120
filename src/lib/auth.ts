// 회원가입/로그인/세션 관리 (프로토타입)
// - 회원 목록: Supabase public.users 테이블 (RLS 없음, anon key 접근)
// - 세션: localStorage 저장 (브라우저 전용)
// ⚠ 운영 전 Supabase Auth + RLS 전환 필요. SHA-256 해시는 임시 조치입니다.

import { supabase, isSupabaseConfigured } from "./supabase";
import type { Role } from "./types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  department: string | null;
  employeeNo: string | null;
  role: Role;
}

const SESSION_KEY = "sia.session";

// ── 세션 ──────────────────────────────────────────────────────
export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function saveSession(user: SessionUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY);
}

// ── 비밀번호 해시 (임시: SHA-256, salt=email) ─────────────────
async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── 회원가입 ──────────────────────────────────────────────────
export async function signUp(input: {
  email: string;
  password: string;
  name: string;
  department?: string;
  employeeNo?: string;
}): Promise<SessionUser> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다. .env.local을 확인하세요.");

  const email = input.email.trim().toLowerCase();

  const { data: existing, error: findError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (findError) throw new Error(`가입 확인 실패: ${findError.message}`);
  if (existing) throw new Error("이미 가입된 이메일입니다.");

  const password_hash = await hashPassword(email, input.password);
  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      name: input.name.trim(),
      department: input.department?.trim() || null,
      employee_no: input.employeeNo?.trim() || null,
      password_hash,
    })
    .select("id, email, name, department, employee_no, role")
    .single();
  if (error) throw new Error(`회원가입 실패: ${error.message}`);

  const user: SessionUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    department: data.department,
    employeeNo: data.employee_no,
    role: data.role as Role,
  };
  saveSession(user);
  return user;
}

// ── 로그인 ────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string,
): Promise<SessionUser> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다. .env.local을 확인하세요.");

  const normalized = email.trim().toLowerCase();
  const password_hash = await hashPassword(normalized, password);

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, department, employee_no, role, is_active")
    .eq("email", normalized)
    .eq("password_hash", password_hash)
    .maybeSingle();
  if (error) throw new Error(`로그인 실패: ${error.message}`);
  if (!data) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  if (!data.is_active) throw new Error("비활성화된 계정입니다. 관리자에게 문의하세요.");

  // 마지막 로그인 시각 갱신 (실패해도 로그인은 진행)
  void supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.id)
    .then();

  const user: SessionUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    department: data.department,
    employeeNo: data.employee_no,
    role: data.role as Role,
  };
  saveSession(user);
  return user;
}

// ── 데모 모드 (Supabase 미설정 시 UI 확인용) ──────────────────
export function signInDemo(): SessionUser {
  const user: SessionUser = {
    id: "demo",
    email: "demo@hospital.example",
    name: "데모 사용자",
    department: "감염관리실",
    employeeNo: "0000",
    role: "ICP",
  };
  saveSession(user);
  return user;
}

export { isSupabaseConfigured };
