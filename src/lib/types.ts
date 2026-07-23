// icqa (Infection Control Q&A) 도메인 타입 — PRD 섹션 6 데이터 모델 기반

export type Role = "USER" | "ICP" | "ADMIN";

export type SourceType =
  | "INTERNAL"
  | "KDCA"
  | "INTERNATIONAL"
  | "ICCON"
  | "FAQ";

// 지식베이스 주제 분류 — 메디통 ICCON 분류 체계 참고
export const KB_CATEGORIES = [
  "다제내성균주관리",
  "발생부위별 감염관리활동",
  "올바른 세척과 소독",
  "직원 감염관리",
  "감염관리체계",
  "유행발생관리",
  "환경관리",
] as const;

export type KbCategory = (typeof KB_CATEGORIES)[number];

export type DocumentStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED";

export type FeedbackRating = "HELPFUL" | "INACCURATE" | "INCOMPLETE";

export type FeedbackStatus = "OPEN" | "REVIEWED" | "RESOLVED";

export type MessageRole = "USER" | "ASSISTANT";

export interface User {
  id: string;
  employeeNo: string;
  email: string;
  name: string;
  department: string;
  role: Role;
  isActive: boolean;
}

export interface Citation {
  index: number;
  documentTitle: string;
  section: string;
  page: number;
  revisedAt: string; // YYYY-MM-DD
  snippet: string;
  sourceType: SourceType;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  isFallback?: boolean;
  isBlocked?: boolean;
  latencyMs?: number;
  citations?: Citation[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  isFavorite: boolean;
  updatedAt: string;
  messages: Message[];
}

export interface DocumentItem {
  id: string;
  title: string;
  sourceType: SourceType;
  category?: KbCategory;
  version: number;
  status: DocumentStatus;
  revisedAt: string;
  uploadedBy: string;
  approvedBy: string | null;
  chunkCount: number;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  question: string;
  answerSnippet: string;
  rating: FeedbackRating;
  comment: string;
  status: FeedbackStatus;
  user: string;
  createdAt: string;
}

export interface StatPoint {
  label: string;
  queries: number;
  fallbacks: number;
  avgLatencyMs: number;
}
