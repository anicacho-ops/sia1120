// 공용 UI 프리미티브 (배지, 뱃지색 매핑 등)
import type { SourceType, DocumentStatus, FeedbackStatus } from "@/lib/types";

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "primary" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    muted: "bg-surface-2 text-muted",
    primary: "bg-primary-soft text-primary-hover",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const SOURCE_LABEL: Record<SourceType, string> = {
  INTERNAL: "기관 지침",
  KDCA: "질병관리청",
  INTERNATIONAL: "WHO/CDC",
  ICCON: "ICCON(메디통)",
  FAQ: "FAQ",
};
const SOURCE_TONE: Record<
  SourceType,
  "primary" | "info" | "success" | "warning" | "muted"
> = {
  INTERNAL: "primary",
  KDCA: "info",
  INTERNATIONAL: "success",
  ICCON: "warning",
  FAQ: "muted",
};

export function SourceBadge({ type }: { type: SourceType }) {
  return <Badge tone={SOURCE_TONE[type]}>{SOURCE_LABEL[type]}</Badge>;
}

const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  DRAFT: "초안",
  IN_REVIEW: "검수 중",
  APPROVED: "승인됨",
  ARCHIVED: "보관",
};
const DOC_STATUS_TONE: Record<
  DocumentStatus,
  "muted" | "warning" | "success" | "info"
> = {
  DRAFT: "muted",
  IN_REVIEW: "warning",
  APPROVED: "success",
  ARCHIVED: "info",
};

export function DocStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={DOC_STATUS_TONE[status]}>{DOC_STATUS_LABEL[status]}</Badge>;
}

const FB_STATUS_LABEL: Record<FeedbackStatus, string> = {
  OPEN: "대기",
  REVIEWED: "검토됨",
  RESOLVED: "처리 완료",
};
const FB_STATUS_TONE: Record<FeedbackStatus, "danger" | "warning" | "success"> = {
  OPEN: "danger",
  REVIEWED: "warning",
  RESOLVED: "success",
};

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge tone={FB_STATUS_TONE[status]}>{FB_STATUS_LABEL[status]}</Badge>;
}
