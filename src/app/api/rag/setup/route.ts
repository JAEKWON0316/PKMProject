import { NextResponse } from 'next/server';
import { applySqlMigration } from '@/lib/utils/migrations';
import { testSupabaseConnection } from '@/lib/supabase';

/**
 * RAG 시스템 설정 API
 * Supabase 데이터베이스에 필요한 테이블, 인덱스, 함수 등을 생성합니다.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Supabase 연결 테스트
    console.log('Supabase 연결 테스트 중...');
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, error: `Supabase 연결 실패: ${connectionTest.message}` },
        { status: 500 }
      );
    }
    
    console.log('Supabase 연결 성공!');
    
    // 2. 마이그레이션 파일 적용
    console.log('RAG 테이블 마이그레이션 시작...');
    const migrationResult = await applySqlMigration('create_rag_tables.sql');
    
    if (!migrationResult.success) {
      return NextResponse.json(
        { success: false, error: `마이그레이션 실패: ${migrationResult.message}` },
        { status: 500 }
      );
    }
    
    console.log('마이그레이션 성공!');
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'RAG 시스템 설정이 완료되었습니다.',
      details: {
        connection: connectionTest.message,
        migration: migrationResult.message
      }
    });
  } catch (error) {
    console.error('RAG 시스템 설정 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '설정 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청으로도 설정 페이지에 접근할 수 있도록 합니다.
 * 브라우저에서 직접 URL을 입력하여 접근하는 경우 사용됩니다.
 */
export async function GET(request: Request): Promise<Response> {
  return NextResponse.json({
    success: true,
    message: '이 API는 POST 요청으로 사용해 주세요.',
    instructions: '이 API를 사용하여 RAG 시스템을 설정하려면 다음 방법을 사용하세요:',
    methods: [
      {
        title: '직접 API 호출',
        code: `
// PowerShell에서 실행
$body = @{} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/rag/setup" -Method POST -Body $body -ContentType "application/json"
`
      },
      {
        title: '설정 페이지에서 설정 버튼 클릭',
        url: '/rag/setup'
      }
    ]
  });
} 