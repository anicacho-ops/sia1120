"use client";

// 회원 관리 (ADMIN) — Supabase users 테이블 연동.
// Supabase 미설정 시 데모 데이터로 표시됩니다.

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Badge } from "@/components/ui";
import type { Role } from "@/lib/types";

interface UserRow {
  id: string;
  email: string;
  name: string;
  department: string | null;
  employee_no: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

const DEMO_USERS: UserRow[] = [
  {
    id: "demo-1",
    email: "icp@hospital.example",
    name: "김감염",
    department: "감염관리실",
    employee_no: "2021-0456",
    role: "ICP",
    is_active: true,
    created_at: "2026-07-01T09:00:00+09:00",
    last_login_at: "2026-07-23T08:55:00+09:00",
  },
  {
    id: "demo-2",
    email: "admin@hospital.example",
    name: "이관리",
    department: "정보전략팀",
    employee_no: "2018-0102",
    role: "ADMIN",
    is_active: true,
    created_at: "2026-07-01T09:00:00+09:00",
    last_login_at: "2026-07-22T17:30:00+09:00",
  },
  {
    id: "demo-3",
    email: "nurse@hospital.example",
    name: "정간호",
    department: "내과병동",
    employee_no: "2023-0789",
    role: "USER",
    is_active: true,
    created_at: "2026-07-10T14:00:00+09:00",
    last_login_at: "2026-07-23T07:40:00+09:00",
  },
  {
    id: "demo-4",
    email: "left@hospital.example",
    name: "박퇴직",
    department: "외과병동",
    employee_no: "2019-0333",
    role: "USER",
    is_active: false,
    created_at: "2026-07-05T10:00:00+09:00",
    last_login_at: null,
  },
];

const ROLE_TONE: Record<Role, "muted" | "primary" | "danger"> = {
  USER: "muted",
  ICP: "primary",
  ADMIN: "danger",
};
const ROLES: Role[] = ["USER", "ICP", "ADMIN"];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setUsers(DEMO_USERS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, email, name, department, employee_no, role, is_active, created_at, last_login_at",
      )
      .order("created_at", { ascending: false });
    if (error) {
      setError(`회원 목록 조회 실패: ${error.message}`);
      setUsers([]);
    } else {
      setUsers((data ?? []) as UserRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(u: UserRow, role: Role) {
    if (!supabase) return;
    setBusyId(u.id);
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", u.id);
    if (error) setError(`역할 변경 실패: ${error.message}`);
    else setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    setBusyId(null);
  }

  async function toggleActive(u: UserRow) {
    if (!supabase) return;
    setBusyId(u.id);
    const { error } = await supabase
      .from("users")
      .update({ is_active: !u.is_active })
      .eq("id", u.id);
    if (error) setError(`상태 변경 실패: ${error.message}`);
    else
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, is_active: !x.is_active } : x,
        ),
      );
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">회원 관리</h2>
          <p className="text-sm text-muted">
            가입 회원 {users.length}명
            {!isSupabaseConfigured && " · 데모 데이터 (Supabase 미설정)"}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-foreground"
        >
          새로고침
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3 font-semibold">이름</th>
              <th className="px-4 py-3 font-semibold">이메일</th>
              <th className="px-4 py-3 font-semibold">부서 / 사번</th>
              <th className="px-4 py-3 font-semibold">역할</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">가입일</th>
              <th className="px-4 py-3 font-semibold">최근 로그인</th>
              <th className="px-4 py-3 text-right font-semibold">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  가입한 회원이 없습니다.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
                        {u.name[0]}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">
                    {u.department ?? "—"}
                    {u.employee_no && (
                      <span className="text-xs"> · {u.employee_no}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <Badge tone="success">활성</Badge>
                    ) : (
                      <Badge tone="muted">비활성</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-muted">
                    {fmtDate(u.last_login_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={u.role}
                        disabled={!isSupabaseConfigured || busyId === u.id}
                        onChange={(e) => void changeRole(u, e.target.value as Role)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none disabled:opacity-40"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => void toggleActive(u)}
                        disabled={!isSupabaseConfigured || busyId === u.id}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition disabled:opacity-40 ${
                          u.is_active
                            ? "bg-danger-soft text-danger"
                            : "bg-success-soft text-success"
                        }`}
                      >
                        {u.is_active ? "비활성화" : "활성화"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isSupabaseConfigured && (
        <p className="text-xs text-muted">
          Supabase 설정 후에는 실제 가입 회원이 표시되고 역할·상태 변경이
          활성화됩니다.
        </p>
      )}
    </div>
  );
}
