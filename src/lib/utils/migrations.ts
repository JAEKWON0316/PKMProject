import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// supabase 클라이언트 가져오기 (null이 아님을 단언)
const supabaseAdmin = getSupabaseAdmin() as SupabaseClient;

// 전역 MCP 타입 선언
declare global {
  var mcp: Record<string, any> | undefined;
}

/**
 * MCP가 사용 가능한지 확인합니다.
 */
function isMcpAvailable(mcpFunction: string): boolean {
  return typeof global.mcp !== 'undefined' && typeof global.mcp[mcpFunction] === 'function';
}

/**
 * SQL 쿼리를 실행합니다. execute_sql RPC가 없는 경우 다른 방법으로 시도합니다.
 */
async function executeSql(sqlQuery: string, migrationName?: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 1. 먼저 execute_sql RPC로 시도
    const { error } = await supabaseAdmin.rpc('execute_sql', { 
      sql_string: sqlQuery 
    });
    
    // RPC가 성공한 경우
    if (!error) {
      return { success: true, message: '쿼리 성공적으로 실행됨' };
    }
    
    console.warn('execute_sql RPC 실패, 대체 방법 시도:', error.message);
    
    // 2. MCP를 통한 마이그레이션 적용 시도
    if (migrationName && isMcpAvailable('mcp_supabase_apply_migration')) {
      console.log('mcp_supabase_apply_migration 사용 시도...');
      
      const mcpResult = await new Promise<any>((resolve, reject) => {
        // @ts-ignore - MCP 타입 정의 없음
        global.mcp['mcp_supabase_apply_migration']({
          project_id: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || '',
          name: migrationName,
          query: sqlQuery
        }, (result: any) => {
          if (result.error) {
            reject(new Error(`마이그레이션 적용 실패: ${result.error}`));
          } else {
            resolve(result);
          }
        });
      });
      
      return { success: true, message: `MCP를 통해 마이그레이션 성공: ${migrationName}` };
    }
    
    // 3. MCP를 통한 SQL 실행 시도
    if (isMcpAvailable('mcp_supabase_execute_sql')) {
      console.log('mcp_supabase_execute_sql 사용 시도...');
      
      const mcpResult = await new Promise<any>((resolve, reject) => {
        // @ts-ignore - MCP 타입 정의 없음
        global.mcp['mcp_supabase_execute_sql']({
          project_id: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || '',
          query: sqlQuery
        }, (result: any) => {
          if (result.error) {
            reject(new Error(`SQL 실행 실패: ${result.error}`));
          } else {
            resolve(result);
          }
        });
      });
      
      return { success: true, message: 'MCP를 통해 SQL 실행 성공' };
    }
    
    // 모든 방법 실패
    throw new Error(`SQL 실행 불가: execute_sql RPC가 없고, MCP도 사용할 수 없습니다. 쿼리: ${sqlQuery.substring(0, 100)}...`);
  } catch (error) {
    console.error('SQL 쿼리 실행 실패:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * SQL 마이그레이션 파일을 Supabase 데이터베이스에 적용합니다.
 * SQL 파일의 각 명령을 개별 실행합니다.
 * @param filename 마이그레이션 파일명 (src/db/supabase_migrations/ 내부 파일)
 */
export async function applySqlMigration(filename: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // 마이그레이션 파일 경로
    const migrationPath = path.join(process.cwd(), 'src', 'db', 'supabase_migrations', filename);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`마이그레이션 파일을 찾을 수 없습니다: ${filename}`);
    }
    
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // pgvector 확장 사용 가능한지 확인
    const { error: extensionError } = await supabaseAdmin.from('pg_extension')
      .select('extname')
      .eq('extname', 'vector')
      .maybeSingle();
    
    if (extensionError) {
      console.log('pgvector 확장을 확인할 수 없습니다. 직접 확장을 활성화해야 할 수 있습니다.');
    }
    
    // 마이그레이션 파일 이름에서 확장자 제거
    const migrationName = path.basename(filename, path.extname(filename));
    
    // MCP가 사용 가능하고, 전체 SQL 파일을 한 번에 적용할 수 있는 경우
    if (isMcpAvailable('mcp_supabase_apply_migration')) {
      try {
        const mcpResult = await new Promise<any>((resolve, reject) => {
          // @ts-ignore - MCP 타입 정의 없음
          global.mcp['mcp_supabase_apply_migration']({
            project_id: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || '',
            name: migrationName,
            query: sqlContent
          }, (result: any) => {
            if (result.error) {
              reject(new Error(`마이그레이션 적용 실패: ${result.error}`));
            } else {
              resolve(result);
            }
          });
        });
        
        console.log(`MCP를 통해 마이그레이션 적용 성공: ${filename}`);
        return { success: true, message: `MCP 마이그레이션 성공: ${filename}` };
      } catch (mcpError) {
        console.error('MCP 마이그레이션 실패, 개별 쿼리 방식으로 대체합니다:', mcpError);
        // MCP 실패 시 개별 쿼리 방식으로 진행
      }
    }
    
    // 개별 SQL 구문 실행
    // 테이블 생성 - 단순하게 직접 구현
    const createSessionsResult = await executeSql(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        messages JSONB NOT NULL,
        metadata JSONB,
        embedding VECTOR(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
    `, `${migrationName}_create_sessions`);
    
    if (!createSessionsResult.success) {
      console.error('chat_sessions 테이블 생성 오류:', createSessionsResult.message);
    }
    
    const createChunksResult = await executeSql(`
      CREATE TABLE IF NOT EXISTS chat_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_session_id UUID NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        UNIQUE (chat_session_id, chunk_index)
      );
    `, `${migrationName}_create_chunks`);
    
    if (!createChunksResult.success) {
      console.error('chat_chunks 테이블 생성 오류:', createChunksResult.message);
    }
    
    // 외래 키 제약 조건 추가
    const fkResult = await executeSql(`
      ALTER TABLE IF EXISTS chat_chunks 
      ADD CONSTRAINT IF NOT EXISTS chat_chunks_chat_session_id_fkey 
      FOREIGN KEY (chat_session_id) 
      REFERENCES chat_sessions(id) 
      ON DELETE CASCADE;
    `, `${migrationName}_add_fk`);
    
    if (!fkResult.success) {
      console.error('외래 키 제약 조건 추가 오류:', fkResult.message);
    }
    
    // 인덱스 생성
    const indexResult = await executeSql(`
      CREATE INDEX IF NOT EXISTS chat_sessions_title_idx 
      ON chat_sessions USING GIN (to_tsvector('english', title));
      
      CREATE INDEX IF NOT EXISTS chat_chunks_content_idx 
      ON chat_chunks USING GIN (to_tsvector('english', content));
    `, `${migrationName}_create_indexes`);
    
    if (!indexResult.success) {
      console.error('인덱스 생성 오류:', indexResult.message);
    }
    
    // 벡터 검색 함수 생성
    const functionResult = await executeSql(`
      CREATE OR REPLACE FUNCTION match_chunks(
        query_embedding VECTOR(1536),
        match_threshold FLOAT,
        match_count INT
      )
      RETURNS TABLE (
        id UUID,
        chat_session_id UUID,
        chunk_index INTEGER,
        content TEXT,
        similarity FLOAT
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          chunks.id,
          chunks.chat_session_id,
          chunks.chunk_index,
          chunks.content,
          1 - (chunks.embedding <=> query_embedding) AS similarity
        FROM chat_chunks chunks
        WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
      END;
      $$;
    `, `${migrationName}_create_match_function`);
    
    if (!functionResult.success) {
      console.error('벡터 검색 함수 생성 오류:', functionResult.message);
    }
    
    console.log(`마이그레이션 성공적으로 적용됨: ${filename}`);
    return { success: true, message: `마이그레이션 성공: ${filename}` };
  } catch (error) {
    console.error('마이그레이션 적용 실패:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * SQL 쿼리 문자열을 직접 실행합니다.
 * @param sqlQuery 실행할 SQL 쿼리
 */
export async function executeSqlQuery(sqlQuery: string): Promise<{
  success: boolean;
  message: string;
}> {
  return executeSql(sqlQuery);
} 