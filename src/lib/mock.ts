// UI 데모용 목(mock) 데이터. 실제 데이터는 이후 Supabase 연동으로 대체됩니다.
// 주의: PRD 원칙에 따라 실제 환자정보는 절대 포함하지 않습니다 (가상 데이터만).

import type {
  ChatSession,
  Citation,
  DocumentItem,
  FeedbackItem,
  StatPoint,
  User,
} from "./types";

export const currentUser: User = {
  id: "u1",
  employeeNo: "2021-0456",
  email: "icp@hospital.example",
  name: "김감염",
  department: "감염관리실",
  role: "ICP",
  isActive: true,
};

const sampleCitations: Citation[] = [
  {
    index: 1,
    documentTitle: "감염관리 매뉴얼",
    section: "5.2 접촉주의(Contact Precautions)",
    page: 47,
    revisedAt: "2026-03-15",
    snippet:
      "CRE 보균자는 연속 3회(최소 48시간 간격) 감시배양 음성 확인 시 접촉주의 격리를 해제할 수 있다.",
    sourceType: "INTERNAL",
  },
  {
    index: 2,
    documentTitle: "다제내성균 관리지침",
    section: "3.1 격리 해제 기준",
    page: 12,
    revisedAt: "2025-11-02",
    snippet:
      "직전 항균제 투여 종료 후 최소 1주 경과한 상태에서 감시배양을 시행하는 것을 권장한다.",
    sourceType: "KDCA",
  },
  {
    index: 3,
    documentTitle: "ICCON 감염관리 Q&A (메디통)",
    section: "다제내성균주관리",
    page: 0,
    revisedAt: "2022-08-01",
    snippet:
      "실무 사례: CRE 접촉주의 해제 시 감시배양 검체 채취 부위와 간격에 대한 현장 질의응답 (참고자료 · 이용허락 확보 후 색인).",
    sourceType: "ICCON",
  },
];

export const sessions: ChatSession[] = [
  {
    id: "s1",
    title: "CRE 환자 격리 해제 기준",
    isFavorite: true,
    updatedAt: "2026-07-23T09:12:00+09:00",
    messages: [
      {
        id: "m1",
        role: "USER",
        content: "CRE 환자 격리 해제 기준이 어떻게 되나요?",
        createdAt: "2026-07-23T09:11:40+09:00",
      },
      {
        id: "m2",
        role: "ASSISTANT",
        content:
          "CRE(카바페넴 내성 장내세균) 보균자의 접촉주의 격리 해제는 다음 기준을 따릅니다 [1].\n\n- 연속 3회 감시배양 음성 (최소 48시간 간격)\n- 직전 항균제 투여 종료 후 최소 1주 경과 후 배양 시행 권장 [2]\n\n기관별 상황에 따라 감염관리실 판단이 우선하며, 개별 환자의 임상 상태는 담당의와 상의하시기 바랍니다.",
        citations: sampleCitations,
        latencyMs: 3200,
        createdAt: "2026-07-23T09:11:44+09:00",
      },
    ],
  },
  {
    id: "s2",
    title: "손위생 5 moments 교육자료",
    isFavorite: false,
    updatedAt: "2026-07-22T15:40:00+09:00",
    messages: [
      {
        id: "m3",
        role: "USER",
        content: "손위생 5 moments 내용 알려줘",
        createdAt: "2026-07-22T15:39:30+09:00",
      },
      {
        id: "m4",
        role: "ASSISTANT",
        content:
          "WHO 손위생 5 moments는 다음과 같습니다 [1].\n\n1. 환자 접촉 전\n2. 청결/무균 처치 전\n3. 체액 노출 위험 후\n4. 환자 접촉 후\n5. 환자 주변 환경 접촉 후",
        citations: [
          {
            index: 1,
            documentTitle: "WHO Hand Hygiene Guideline",
            section: "My 5 Moments for Hand Hygiene",
            page: 3,
            revisedAt: "2024-05-05",
            snippet:
              "The My 5 Moments for Hand Hygiene approach defines the key moments when health-care workers should perform hand hygiene.",
            sourceType: "INTERNATIONAL",
          },
        ],
        latencyMs: 2800,
        createdAt: "2026-07-22T15:39:34+09:00",
      },
    ],
  },
  {
    id: "s3",
    title: "결핵 의심 환자 병실 배정",
    isFavorite: false,
    updatedAt: "2026-07-21T11:05:00+09:00",
    messages: [
      {
        id: "m5",
        role: "USER",
        content: "활동성 결핵 의심 환자는 어떤 병실에 배정하나요?",
        createdAt: "2026-07-21T11:04:50+09:00",
      },
      {
        id: "m6",
        role: "ASSISTANT",
        content:
          "활동성 결핵이 의심되는 환자는 공기주의(Airborne Precautions)를 적용하며, 음압격리병실에 배정하는 것을 원칙으로 합니다 [1].",
        citations: [
          {
            index: 1,
            documentTitle: "감염관리 매뉴얼",
            section: "6.1 공기주의",
            page: 58,
            revisedAt: "2026-03-15",
            snippet:
              "활동성 폐결핵 또는 의심 환자는 음압이 유지되는 1인 격리병실에 배치한다.",
            sourceType: "INTERNAL",
          },
        ],
        latencyMs: 3010,
        createdAt: "2026-07-21T11:04:54+09:00",
      },
    ],
  },
];

export const documents: DocumentItem[] = [
  {
    id: "d1",
    title: "감염관리 매뉴얼",
    sourceType: "INTERNAL",
    category: "감염관리체계",
    version: 4,
    status: "APPROVED",
    revisedAt: "2026-03-15",
    uploadedBy: "김감염",
    approvedBy: "이관리",
    chunkCount: 512,
    createdAt: "2026-03-16",
  },
  {
    id: "d2",
    title: "다제내성균 관리지침",
    sourceType: "KDCA",
    category: "다제내성균주관리",
    version: 2,
    status: "APPROVED",
    revisedAt: "2025-11-02",
    uploadedBy: "김감염",
    approvedBy: "이관리",
    chunkCount: 88,
    createdAt: "2025-11-05",
  },
  {
    id: "d6",
    title: "ICCON 감염관리 Q&A 모음집 (라이선스 확인 중)",
    sourceType: "ICCON",
    category: "다제내성균주관리",
    version: 1,
    status: "IN_REVIEW",
    revisedAt: "2022-08-01",
    uploadedBy: "김감염",
    approvedBy: null,
    chunkCount: 0,
    createdAt: "2026-07-23",
  },
  {
    id: "d3",
    title: "카테터 관련 감염 예방 번들",
    sourceType: "INTERNAL",
    version: 1,
    status: "IN_REVIEW",
    revisedAt: "2026-07-10",
    uploadedBy: "박담당",
    approvedBy: null,
    chunkCount: 0,
    createdAt: "2026-07-10",
  },
  {
    id: "d4",
    title: "WHO Hand Hygiene Guideline",
    sourceType: "INTERNATIONAL",
    version: 1,
    status: "APPROVED",
    revisedAt: "2024-05-05",
    uploadedBy: "김감염",
    approvedBy: "이관리",
    chunkCount: 41,
    createdAt: "2024-06-01",
  },
  {
    id: "d5",
    title: "2023 개정 격리지침 (구버전)",
    sourceType: "INTERNAL",
    version: 3,
    status: "ARCHIVED",
    revisedAt: "2023-09-01",
    uploadedBy: "김감염",
    approvedBy: "이관리",
    chunkCount: 480,
    createdAt: "2023-09-02",
  },
];

export const feedbackItems: FeedbackItem[] = [
  {
    id: "f1",
    question: "VRE 격리 해제도 CRE랑 같나요?",
    answerSnippet:
      "VRE 격리 해제 기준은 연속 배양 음성 확인을 포함하며...",
    rating: "INACCURATE",
    comment: "우리 병원 지침은 배양 횟수가 다릅니다. 재확인 필요.",
    status: "OPEN",
    user: "정간호",
    createdAt: "2026-07-23T08:20:00+09:00",
  },
  {
    id: "f2",
    question: "코호트 격리 시 병실 인원 제한 있나요?",
    answerSnippet: "코호트 격리는 동일 병원체 보균 환자를 같은 구역에...",
    rating: "INCOMPLETE",
    comment: "인원 상한에 대한 언급이 없어요.",
    status: "OPEN",
    user: "최간호",
    createdAt: "2026-07-22T14:10:00+09:00",
  },
  {
    id: "f3",
    question: "N95 착용 후 밀착도 검사 주기는?",
    answerSnippet: "밀착도 검사(fit test)는 연 1회 시행을 권장하며...",
    rating: "HELPFUL",
    comment: "",
    status: "RESOLVED",
    user: "한간호",
    createdAt: "2026-07-20T10:00:00+09:00",
  },
];

export const statSeries: StatPoint[] = [
  { label: "월", queries: 142, fallbacks: 18, avgLatencyMs: 3400 },
  { label: "화", queries: 168, fallbacks: 21, avgLatencyMs: 3200 },
  { label: "수", queries: 155, fallbacks: 15, avgLatencyMs: 3600 },
  { label: "목", queries: 189, fallbacks: 24, avgLatencyMs: 3100 },
  { label: "금", queries: 203, fallbacks: 19, avgLatencyMs: 2900 },
  { label: "토", queries: 78, fallbacks: 9, avgLatencyMs: 3300 },
  { label: "일", queries: 64, fallbacks: 7, avgLatencyMs: 3500 },
];

export const topFallbacks = [
  { question: "VRE 접촉주의 해제 기준", count: 14 },
  { question: "코호트 격리 인원 제한", count: 11 },
  { question: "외래 환자 마스크 착용 정책", count: 9 },
  { question: "직원 백신 접종 기록 조회", count: 7 },
  { question: "폐기물 분류 세부 기준", count: 6 },
];
