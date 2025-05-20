import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 클라이언트 인스턴스
let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseClient: SupabaseClient | null = null;

// Supabase 환경 변수
// 클라이언트 측 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key-for-client';

// 서버 측 환경 변수 (NEXT_PUBLIC_ 접두사가 없는 것들)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'dummy-key-for-server';

/**
 * 서버 측에서 사용할 Supabase 클라이언트 (싱글톤 패턴)
 * 서비스 키를 사용하여 RLS를 우회합니다.
 */
export function getSupabaseAdmin() {
  if (!_supabaseAdmin && typeof window === 'undefined') {
    if (!process.env.SUPABASE_SERVICE_KEY) {
      console.warn('SUPABASE_SERVICE_KEY 환경 변수가 설정되지 않았습니다. 서버 측 기능이 제한될 수 있습니다.');
    }
    
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      }
    });
  }
  return _supabaseAdmin;
}

/**
 * 클라이언트 측에서 사용할 Supabase 클라이언트 (싱글톤 패턴)
 * 익명 키를 사용하여 RLS가 적용됩니다.
 */
export function getSupabaseClient() {
  if (!_supabaseClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다. 클라이언트 측 기능이 제한될 수 있습니다.');
    }
    
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      }
    });
  }
  return _supabaseClient;
}

// 이전 코드와의 호환성을 위한 exports
// 서버 환경에서만 supabaseAdmin을 초기화하고, 클라이언트 측에서는 null 반환
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdmin() : null;
export const supabaseClient = getSupabaseClient();

/**
 * 백엔드 API에서 사용할 Supabase 클라이언트 인스턴스를 반환합니다.
 * RLS 정책을 우회할 수 있는 서비스 키를 사용합니다.
 */
export function getServerSupabase() {
  return getSupabaseAdmin();
}

/**
 * 브라우저에서 사용할 Supabase 클라이언트 인스턴스를 반환합니다.
 * RLS 정책이 적용된 익명 키를 사용합니다.
 */
export function getClientSupabase() {
  return getSupabaseClient();
}

// Supabase 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    // 실행 환경에 따라 다른 키 검증
    if (typeof window === 'undefined') {
      // 서버 측
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다');
      }
      
      if (!process.env.SUPABASE_SERVICE_KEY) {
        console.warn('SUPABASE_SERVICE_KEY가 설정되지 않았습니다');
      }
    } else {
      // 클라이언트 측
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다');
      }
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다');
      }
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