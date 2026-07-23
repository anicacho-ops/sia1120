import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            시
          </div>
          <h1 className="mt-4 text-xl font-bold">시아 · 감염관리 Q&amp;A</h1>
          <p className="mt-1 text-sm text-muted">
            사내 계정으로 로그인하세요.
          </p>
        </div>

        <form className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium">
              이메일 또는 사번
            </label>
            <input
              type="text"
              placeholder="employee@hospital.example"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">비밀번호</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Link
            href="/chat"
            className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            로그인
          </Link>
          <p className="text-center text-xs text-muted">
            SSO 연동은 추후 지원 예정입니다.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          전 구간 HTTPS · 비밀번호 bcrypt 저장 · JWT 만료 8시간
        </p>
      </div>
    </div>
  );
}
