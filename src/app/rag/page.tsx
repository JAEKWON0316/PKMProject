'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RagResponse } from '@/types';

export default function RagPage() {
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [ragResponse, setRagResponse] = useState<RagResponse | null>(null);
  const router = useRouter();

  // ChatGPT 대화 저장 함수
  const handleSaveConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/rag/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '대화를 저장하는 중 오류가 발생했습니다.');
      }
      
      // 중복 URL 처리
      if (data.duplicate) {
        setResult({
          ...data.data,
          duplicate: true,
          message: data.message || '이미 저장된 대화입니다.'
        });
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 질의응답 함수
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setError(null);
    setRagResponse(null);
    
    try {
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, similarity: 0.3, limit: 10 })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '질문에 대한 답변을 생성하는 중 오류가 발생했습니다.');
      }
      
      setRagResponse(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">RAG 시스템</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ChatGPT 대화 저장 폼 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">ChatGPT 대화 저장</h2>
          <form onSubmit={handleSaveConversation}>
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium mb-2">
                ChatGPT 공유 URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://chat.openai.com/share/..."
                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? '처리 중...' : '대화 저장'}
            </button>
          </form>
          
          {/* 저장 결과 표시 */}
          {result && (
            <div className={`mt-6 p-4 ${result.duplicate ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-gray-50 dark:bg-gray-700'} rounded-md`}>
              <h3 className="text-lg font-medium mb-2">
                {result.duplicate ? '중복 감지!' : '저장 완료!'}
              </h3>
              
              {result.duplicate ? (
                <>
                  <p className="mb-2">{result.message}</p>
                  <p className="mb-2"><strong>제목:</strong> {result.title}</p>
                  <p className="text-sm text-gray-500">ID: {result.id}</p>
                </>
              ) : (
                <>
                  <p className="mb-2"><strong>제목:</strong> {result.title}</p>
                  <p className="mb-2"><strong>요약:</strong> {result.summary.substring(0, 100)}...</p>
                  <p className="mb-2"><strong>청크:</strong> {result.chunks}개</p>
                  <p className="text-sm text-gray-500">ID: {result.id}</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 질의응답 폼 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">질문하기</h2>
          <form onSubmit={handleAskQuestion}>
            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium mb-2">
                질문
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="질문을 입력하세요..."
                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
                rows={4}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? '응답 생성 중...' : '질문하기'}
            </button>
          </form>
          
          {/* 질의응답 결과 표시 */}
          {ragResponse && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">답변</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md mb-4 whitespace-pre-wrap">
                {ragResponse.answer}
              </div>
              
              {ragResponse.sources.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-2">출처</h4>
                  <ul className="space-y-2">
                    {ragResponse.sources.map((source, i) => (
                      <li key={i} className="p-3 bg-gray-100 dark:bg-gray-600 rounded-md">
                        <p className="font-medium">{source.title}</p>
                        {source.url && (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm"
                          >
                            원본 대화 보기
                          </a>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          유사도: {(source.similarity || 0).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
          <p className="font-medium">오류 발생</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 