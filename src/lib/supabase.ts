// Supabase 클라이언트 (브라우저용, anon key).
// 실제 데이터 연동은 이후 단계에서. 지금은 환경변수만 세팅되어 있으면 클라이언트를 생성합니다.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 아직 없으면 null을 반환해 UI가 목 데이터로 동작하도록 합니다.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(url && anonKey);
