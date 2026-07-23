import { feedbackItems } from "@/lib/mock";
import { Badge, FeedbackStatusBadge } from "@/components/ui";
import type { FeedbackRating } from "@/lib/types";

const RATING_LABEL: Record<FeedbackRating, string> = {
  HELPFUL: "도움됨",
  INACCURATE: "부정확",
  INCOMPLETE: "불충분",
};
const RATING_TONE: Record<FeedbackRating, "success" | "danger" | "warning"> = {
  HELPFUL: "success",
  INACCURATE: "danger",
  INCOMPLETE: "warning",
};

export default function FeedbackPage() {
  const open = feedbackItems.filter((f) => f.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">피드백 검토 큐</h2>
        <p className="text-sm text-muted">
          부정확 피드백은 자동으로 검토 큐에 등록됩니다. 처리 대기 {open}건.
        </p>
      </div>

      <div className="space-y-3">
        {feedbackItems.map((f) => (
          <div
            key={f.id}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={RATING_TONE[f.rating]}>
                    {RATING_LABEL[f.rating]}
                  </Badge>
                  <FeedbackStatusBadge status={f.status} />
                  <span className="text-xs text-muted">
                    {f.user} · {new Date(f.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium">Q. {f.question}</p>
                <p className="mt-1 text-sm text-muted">A. {f.answerSnippet}</p>
                {f.comment && (
                  <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm">
                    💬 {f.comment}
                  </p>
                )}
              </div>
              {f.status !== "RESOLVED" && (
                <div className="flex shrink-0 flex-col gap-2">
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-hover">
                    검토 완료
                  </button>
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground">
                    지침 보강
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
