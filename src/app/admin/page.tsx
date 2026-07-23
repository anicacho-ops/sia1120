import { statSeries, topFallbacks } from "@/lib/mock";

export default function StatsPage() {
  const totalQueries = statSeries.reduce((a, s) => a + s.queries, 0);
  const totalFallbacks = statSeries.reduce((a, s) => a + s.fallbacks, 0);
  const fallbackRate = ((totalFallbacks / totalQueries) * 100).toFixed(1);
  const avgLatency =
    statSeries.reduce((a, s) => a + s.avgLatencyMs, 0) / statSeries.length;
  const maxQ = Math.max(...statSeries.map((s) => s.queries));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">이번 주 개요</h2>
        <p className="text-sm text-muted">최근 7일 질의 통계입니다. (데모 데이터)</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="총 질의 수" value={totalQueries.toLocaleString()} unit="건" />
        <StatCard label="폴백 발생률" value={fallbackRate} unit="%" tone="warning" />
        <StatCard
          label="평균 응답시간"
          value={(avgLatency / 1000).toFixed(1)}
          unit="초"
          tone="info"
        />
      </div>

      {/* 막대 차트 */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">일별 질의 수</h3>
        <div className="mt-6 flex h-48 items-end gap-3">
          {statSeries.map((s) => (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div className="relative w-full">
                  <div
                    className="w-full rounded-t-md bg-primary/20"
                    style={{ height: `${(s.queries / maxQ) * 160}px` }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t-md bg-primary"
                      style={{ height: `${(s.fallbacks / maxQ) * 160}px` }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium">{s.queries}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" /> 전체 질의
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> 폴백
          </span>
        </div>
      </div>

      {/* 폴백 Top N */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">답변 실패(폴백) 질문 Top 5</h3>
        <p className="text-xs text-muted">
          지식베이스 보강이 필요한 질문입니다.
        </p>
        <ul className="mt-4 space-y-2">
          {topFallbacks.map((f, i) => (
            <li
              key={f.question}
              className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
            >
              <span className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                  {i + 1}
                </span>
                {f.question}
              </span>
              <span className="text-sm font-medium text-warning">{f.count}건</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone = "primary",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "primary" | "warning" | "info";
}) {
  const color =
    tone === "warning"
      ? "text-warning"
      : tone === "info"
        ? "text-info"
        : "text-primary-hover";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>
        {value}
        <span className="ml-1 text-base font-medium text-muted">{unit}</span>
      </p>
    </div>
  );
}
