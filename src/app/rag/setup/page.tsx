'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/rag/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '설정 중 오류가 발생했습니다.');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">RAG 시스템 설정</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="mb-4">
          이 페이지에서 RAG 시스템에 필요한 Supabase 데이터베이스 설정을 진행할 수 있습니다.
          아래 버튼을 클릭하여 설정을 시작하세요.
        </p>
        
        <div className="my-6 p-4 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200">
          <h3 className="font-bold">설정 전 확인사항</h3>
          <ol className="list-decimal ml-5 mt-2">
            <li>Supabase 프로젝트가 생성되어 있어야 합니다.</li>
            <li>환경 변수가 올바르게 설정되어 있어야 합니다:
              <ul className="list-disc ml-5 mt-1">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                <li>SUPABASE_SERVICE_KEY</li>
                <li>OPENAI_API_KEY</li>
              </ul>
            </li>
          </ol>
        </div>
        
        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? '설정 중...' : 'RAG 시스템 설정 시작'}
        </button>
        
        {/* 결과 표시 */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-md text-green-700 dark:text-green-200">
            <h3 className="text-lg font-medium mb-2">설정 완료!</h3>
            <p>{result.message}</p>
            
            {result.details && (
              <div className="mt-4">
                <h4 className="font-medium">상세 정보:</h4>
                <ul className="list-disc ml-5 mt-1">
                  {Object.entries(result.details).map(([key, value]) => (
                    <li key={key}>{key}: {value as string}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4">
              <Link 
                href="/rag" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                RAG 시스템으로 이동
              </Link>
            </div>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
            <p className="font-medium">오류 발생</p>
            <p>{error}</p>
            <div className="mt-4">
              <details className="cursor-pointer">
                <summary className="font-medium">문제 해결 방법</summary>
                <div className="mt-2 ml-4">
                  <ul className="list-disc space-y-2">
                    <li><strong>Supabase 연결 오류:</strong> 환경 변수 설정을 확인하고, Supabase 프로젝트가 활성화되어 있는지 확인하세요.</li>
                    <li><strong>OpenAI API 오류:</strong> OpenAI API 키가 올바르게 설정되었는지 확인하세요.</li>
                    <li><strong>SQL 마이그레이션 오류:</strong> Supabase 프로젝트의 SQL 에디터에서 직접 SQL 명령을 실행해 보세요.</li>
                  </ul>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 