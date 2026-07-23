import type { Citation } from "@/lib/types";
import { SourceBadge } from "./ui";

export function SourcePanel({ citations }: { citations: Citation[] }) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface xl:flex">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">출처</h2>
        <p className="mt-0.5 text-xs text-muted">
          답변 근거로 사용된 지침 문서입니다.
        </p>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto p-4">
        {citations.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            선택된 답변의 출처가 여기에 표시됩니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {citations.map((c) => (
              <li
                key={c.index}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {c.index}
                  </span>
                  <SourceBadge type={c.sourceType} />
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug">
                  {c.documentTitle}
                </p>
                <p className="text-xs text-muted">
                  {c.section} · p.{c.page}
                </p>
                <p className="mt-2 border-l-2 border-primary/40 pl-2 text-xs leading-relaxed text-foreground/80">
                  {c.snippet}
                </p>
                <p className="mt-2 text-[11px] text-muted">
                  개정일 {c.revisedAt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
