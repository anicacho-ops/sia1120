# 시아 (icqa) · 감염관리 Q&A

의료기관 감염관리 지침을 근거로, 출처가 명시된 답변을 제공하는 사내 RAG 기반 Q&A 시스템입니다.

**🌐 배포 URL: https://sia-drab.vercel.app**

> 지식베이스(감염관리 지침 3종, 817개 문단)를 OpenAI 임베딩으로 색인하고,
> 질문 시 벡터 검색 → GPT 답변(출처 포함)을 생성합니다. 근거가 없으면 폴백 안내를 반환합니다.

## 기술 스택

| 영역 | 사용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) / TypeScript |
| 스타일 | Tailwind CSS v4 |
| 데이터 (예정) | Supabase (Postgres + pgvector) |
| LLM (예정) | OpenAI API |
| 배포 | Vercel + GitHub |

## 화면

- `/login` — 로그인 / 회원가입 (로그인해야 아래 화면 진입 가능)
- `/chat` — 채팅 Q&A (세션 사이드바 · 스트리밍 답변 · 인용 칩 · 출처 패널)
- `/admin` — 통계 대시보드
- `/admin/documents` — 문서 관리 (업로드/승인/재색인)
- `/admin/feedback` — 피드백 검토 큐

현재 모든 화면은 `src/lib/mock.ts` 의 데모 데이터로 동작합니다.

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

http://localhost:3000 에서 확인.

## 환경변수

`.env.example` 참고. 핵심 값:

- `OPENAI_API_KEY` — OpenAI 키
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용

## 인증 (프로토타입)

- 회원가입 시 회원 정보가 Supabase `public.users` 테이블에 저장됩니다.
- 테이블 생성: Supabase 대시보드 > SQL Editor 에서 `supabase/schema.sql` 실행.
- Supabase 미설정 시 로그인 화면에서 **데모 모드**로 UI를 둘러볼 수 있습니다.

> ⚠ 현재 RLS 없이 anon key로 직접 접근합니다 (요청 사양).
> `NEXT_PUBLIC_*` 값은 브라우저 번들에 포함되어 공개되므로, anon key는
> 숨겨지지 않습니다 — 공개 배포 후 실사용 전에 **Supabase Auth + RLS 전환 필수**.
> 비밀번호는 SHA-256 해시로 저장되지만 이는 임시 조치입니다.

## 참고자료 (외부 출처)

- **ICCON / 메디통** — 감염관리 교육·Q&A 플랫폼. 출처 유형 `ICCON`으로 등록.
  주제 분류(다제내성균주관리, 발생부위별 감염관리활동, 올바른 세척과 소독,
  직원 감염관리, 감염관리체계, 유행발생관리, 환경관리)를 지식베이스 카테고리로 참고.
  ⚠ 본문 콘텐츠는 상업 저작물이므로, **이용허락/구독 계약 확보 후** 정식 제공 파일을
  업로드 파이프라인으로 색인합니다 (PRD 섹션 10 참고).

## 다음 단계

1. Supabase 프로젝트 생성 및 스키마 정의 (PRD 섹션 6 데이터 모델)
2. 인증 연동 (Supabase Auth)
3. 문서 수집 파이프라인 · 임베딩 · 벡터 검색
4. RAG 답변 생성 (PII 마스킹 · 의도 분류 · 폴백)

원본 요구사항은 PRD 문서를 참고하세요.
