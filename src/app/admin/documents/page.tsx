import { documents } from "@/lib/mock";
import { DocStatusBadge, SourceBadge } from "@/components/ui";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">문서 관리</h2>
          <p className="text-sm text-muted">
            승인된(APPROVED) 문서만 검색 대상에 포함됩니다.
          </p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover">
          + 문서 업로드
        </button>
      </div>

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
              <th className="px-4 py-3 font-semibold text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr
                key={d.id}
                className="border-b border-border last:border-0 hover:bg-surface-2/50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted">
                    업로드 {d.uploadedBy}
                    {d.approvedBy && ` · 승인 ${d.approvedBy}`}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <SourceBadge type={d.sourceType} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {d.category ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted">v{d.version}</td>
                <td className="px-4 py-3">
                  <DocStatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {d.chunkCount > 0 ? d.chunkCount.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{d.revisedAt}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs">
                    {d.status === "IN_REVIEW" && (
                      <button className="rounded-md bg-success-soft px-2 py-1 font-medium text-success">
                        승인
                      </button>
                    )}
                    {d.status === "APPROVED" && (
                      <button className="rounded-md bg-surface-2 px-2 py-1 font-medium text-muted">
                        재색인
                      </button>
                    )}
                    <button className="rounded-md px-2 py-1 text-muted hover:text-foreground">
                      상세
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
