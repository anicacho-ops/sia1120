"use client";

// 로그인하지 않은 사용자를 /login 으로 보내는 클라이언트 가드.
// 세션은 localStorage 기반이므로 마운트 후에 확인합니다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    if (getSessionUser()) {
      setStatus("authed");
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (status !== "authed") {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
            시
          </div>
          <p className="mt-3 text-sm text-muted">로그인 확인 중…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
