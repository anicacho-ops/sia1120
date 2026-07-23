import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { AuthGuard } from "@/components/AuthGuard";
import { UserChip } from "@/components/UserChip";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-1 flex-col bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white"
              >
                시
              </Link>
              <div>
                <h1 className="text-sm font-bold leading-tight">관리자 콘솔</h1>
                <p className="text-[11px] leading-tight text-muted">
                  시아 감염관리 Q&amp;A
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="text-sm text-muted transition hover:text-foreground"
              >
                ← 채팅으로
              </Link>
              <UserChip />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-6">
            <AdminNav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
