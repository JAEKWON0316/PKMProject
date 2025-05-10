import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// 서비스 키를 사용한 클라이언트 (백엔드 전용) - RLS 우회
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 익명 키를 사용한 클라이언트 (프론트엔드 안전)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 백엔드 API에서 사용할 Supabase 클라이언트 인스턴스를 반환합니다.
 * RLS 정책을 우회할 수 있는 서비스 키를 사용합니다.
 */
export function getServerSupabase() {
  return supabaseAdmin;
}

/**
 * 브라우저에서 사용할 Supabase 클라이언트 인스턴스를 반환합니다.
 * RLS 정책이 적용된 익명 키를 사용합니다.
 */
export function getClientSupabase() {
  return supabaseClient;
}

// Supabase 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    // 환경 변수만 확인
    if (!supabaseUrl) {
      throw new Error('Supabase URL이 설정되지 않았습니다');
    }
    
    if (!supabaseServiceKey) {
      throw new Error('Supabase 서비스 키가 설정되지 않았습니다');
    }
    
    if (!supabaseAnonKey) {
      throw new Error('Supabase 익명 키가 설정되지 않았습니다');
    }
    
    return { 
      success: true, 
      message: 'Supabase 환경 변수 확인 완료, 마이그레이션을 진행합니다.' 
    };
  } catch (error) {
    console.error('Supabase 연결 테스트 오류:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '알 수 없는 오류' 
    };
  }
} 