"use client";

// 문서(참조문헌) 관리 — Supabase documents 테이블 연동.
// 업로드할 때마다 Supabase에 저장되고, 상태 전이(검수→승인→보관)도 반영됩니다.
// Supabase 미설정 시 데모 데이터로 표시됩니다.

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import { DocStatusBadge, SourceBadge } from "@/components/ui";
import { documents as demoDocuments } from "@/lib/mock";
import {
  KB_CATEGORIES,
  type DocumentStatus,
  type SourceType,
} from "@/lib/types";

interface DocRow {
  id: string;
  title: string;
  source_type: SourceType;
  category: string | null;
  version: number;
  status: DocumentStatus;
  file_name: string | null;
  revised_at: string | null;
  uploaded_by: string | null;
  approved_by: string | null;
  chunk_count: number;
  created_at: string;
}

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "INTERNAL", label: "기관 지침" },
  { value: "KDCA", label: "질병관리청" },
  { value: "INTERNATIONAL", label: "WHO/CDC" },
  { value: "ICCON", label: "ICCON(메디통)" },
  { value: "FAQ", label: "FAQ" },
];

const DEMO_ROWS: DocRow[] = demoDocuments.map((d) => ({
  id: d.id,
  title: d.title,
  source_type: d.sourceType,
  category: d.category ?? null,
  version: d.version,
  status: d.status,
  file_name: null,
  revised_at: d.revisedAt,
  uploaded_by: d.uploadedBy,
  approved_by: d.approvedBy,
  chunk_count: d.chunkCount,
  created_at: d.createdAt,
}));

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 업로드 폼 상태
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("INTERNAL");
  const [category, setCategory] = useState<string>("");
  const [revisedAt, setRevisedAt] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setDocs(DEMO_ROWS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(`문서 목록 조회 실패: ${error.message}`);
      setDocs([]);
    } else {
      setDocs((data ?? []) as DocRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!title.trim()) {
      setError("문서명을 입력하세요.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("documents").insert({
      title: title.trim(),
      source_type: sourceType,
      category: category || null,
      revised_at: revisedAt || null,
      file_name: fileName,
      uploaded_by: getSessionUser()?.name ?? null,
      status: "IN_REVIEW",
    });
    if (error) {
      setError(`문서 등록 실패: ${error.message}`);
    } else {
      setTitle("");
      setCategory("");
      setRevisedAt("");
      setFileName(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function changeStatus(doc: DocRow, status: DocumentStatus) {
    if (!supabase) return;
    setBusyId(doc.id);
    const patch: Record<string, unknown> = { status };
    if (status === "APPROVED") {
      patch.approved_by = getSessionUser()?.name ?? null;
      patch.approved_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("documents")
      .update(patch)
      .eq("id", doc.id);
    if (error) setError(`상태 변경 실패: ${error.message}`);
    else await load();
    setBusyId(null);
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">문서 관리</h2>
          <p className="text-sm text-muted">
            참조문헌 {docs.length}건 · 승인된(APPROVED) 문서만 검색 대상에
            포함됩니다.
            {!isSupabaseConfigured && " · 데모 데이터 (Supabase 미설정)"}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          disabled={!isSupabaseConfigured}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-40"
        >
          {showForm ? "닫기" : "+ 문서 업로드"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* 업로드 폼 */}
      {showForm && (
        <form
          onSubmit={handleUpload}
          className="space-y-4 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                문서명 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 감염관리 매뉴얼 5판"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">출처</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as SourceType)}
                className={inputCls}
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">분류</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">선택 안 함</option>
                {KB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">개정일</label>
              <input
                type="date"
                value={revisedAt}
                onChange={(e) => setRevisedAt(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                파일 (PDF/DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.hwp"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-medium"
              />
              <p className="mt-1 text-[11px] text-muted">
                현재는 파일명만 기록됩니다. 본문 추출·색인은 이후 단계에서
                연동됩니다.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-40"
            >
              {saving ? "등록 중…" : "등록 (검수 대기로)"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3 font-semibold">문서명</th>
              <th className="px-4 py-3 font-semibold">출처</th>
              <th className="px-4 py-3 font-semibold">분류</th>
              <th className="px-4 py-3 font-semibold">버전</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">청크</th>
              <th className="px-4 py-3 font-semibold">개정일</th>
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
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  등록된 문서가 없습니다. 문서를 업로드하세요.
                </td>
              </tr>
            ) : (
              docs.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted">
                      {d.file_name && `${d.file_name} · `}
                      업로드 {d.uploaded_by ?? "—"}
                      {d.approved_by && ` · 승인 ${d.approved_by}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge type={d.source_type} />
                  </td>
                  <td className="px-4 py-3 text-muted">{d.category ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">v{d.version}</td>
                  <td className="px-4 py-3">
                    <DocStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {d.chunk_count > 0 ? d.chunk_count.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{d.revised_at ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 text-xs">
                      {d.status === "DRAFT" && (
                        <button
                          onClick={() => void changeStatus(d, "IN_REVIEW")}
                          disabled={!isSupabaseConfigured || busyId === d.id}
                          className="rounded-md bg-warning-soft px-2 py-1 font-medium text-warning disabled:opacity-40"
                        >
                          검수 요청
                        </button>
                      )}
                      {d.status === "IN_REVIEW" && (
                        <button
                          onClick={() => void changeStatus(d, "APPROVED")}
                          disabled={!isSupabaseConfigured || busyId === d.id}
                          className="rounded-md bg-success-soft px-2 py-1 font-medium text-success disabled:opacity-40"
                        >
                          승인
                        </button>
                      )}
                      {d.status === "APPROVED" && (
                        <button
                          onClick={() => void changeStatus(d, "ARCHIVED")}
                          disabled={!isSupabaseConfigured || busyId === d.id}
                          className="rounded-md bg-surface-2 px-2 py-1 font-medium text-muted disabled:opacity-40"
                        >
                          보관
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
