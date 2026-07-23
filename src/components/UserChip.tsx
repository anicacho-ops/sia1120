"use client";

// 헤더용 로그인 사용자 표시 + 로그아웃 (클라이언트 세션 기반)
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser, signOut, type SessionUser } from "@/lib/auth";

export function UserChip() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
        {user?.name?.[0] ?? "?"}
      </div>
      <span className="text-sm font-medium">{user?.name ?? "…"}</span>
      <button
        onClick={handleSignOut}
        className="rounded-md px-1.5 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-danger"
      >
        나가기
      </button>
    </div>
  );
}
