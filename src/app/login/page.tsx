"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSessionUser,
  isSupabaseConfigured,
  signIn,
  signInDemo,
  signUp,
} from "@/lib/auth";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 이미 로그인 상태면 대시보드로
  useEffect(() => {
    if (getSessionUser()) router.replace("/chat");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("이름을 입력하세요.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp({ email, password, name, department, employeeNo });
      }
      router.replace("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    signInDemo();
    router.replace("/chat");
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            시
          </div>
          <h1 className="mt-4 text-xl font-bold">시아 · 감염관리 Q&amp;A</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login"
              ? "계정으로 로그인하세요."
              : "새 계정을 만드세요."}
          </p>
        </div>

        {/* 로그인 / 회원가입 탭 */}
        <div className="mb-4 grid grid-cols-2 rounded-xl border border-border bg-surface p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                mode === m
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          {mode === "signup" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  이름 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">부서</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="감염관리실"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">사번</label>
                  <input
                    type="text"
                    value={employeeNo}
                    onChange={(e) => setEmployeeNo(e.target.value)}
                    placeholder="2026-0000"
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              이메일 <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@hospital.example"
              autoComplete="email"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              비밀번호 <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "8자 이상" : "••••••••"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className={inputCls}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {!isSupabaseConfigured && (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning">
              Supabase가 아직 설정되지 않았습니다. .env.local 에
              NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 입력하면 회원가입·로그인이
              활성화됩니다.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-40"
          >
            {loading
              ? "처리 중…"
              : mode === "login"
                ? "로그인"
                : "회원가입"}
          </button>

          {!isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleDemo}
              className="w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted transition hover:text-foreground"
            >
              데모 모드로 둘러보기
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          프로토타입: 회원 정보는 Supabase users 테이블에 저장됩니다.
        </p>
      </div>
    </div>
  );
}
