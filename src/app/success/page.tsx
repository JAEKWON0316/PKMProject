import { redirect } from 'next/navigation';
import Link from 'next/link';
import ConversationResult from '@/components/ConversationResult';
import { getChatSessionById } from '@/utils/supabaseHandler';
import { ChatMessage, ChatSession } from '@/types';

interface PageProps {
  searchParams: {
    title?: string;
    url?: string;
    duplicate?: string;
    id?: string;
    summary?: string;
    keywords?: string;
  };
}

export default async function SuccessPage({ searchParams }: PageProps) {
  // 필수 파라미터 확인
  const { id } = searchParams;
  
  // ID가 없으면 메인 페이지로 리다이렉트
  if (!id) {
    redirect('/');
  }
  
  try {
    // Supabase에서 세션 데이터 가져오기
    const sessionData = await getChatSessionById(id);
    
    if (!sessionData) {
      // ID로 데이터를 찾을 수 없으면 메인 페이지로 리다이렉트
      redirect('/');
    }
    
    // 검색 매개변수에서 중복 여부 확인
    const isDuplicate = searchParams.duplicate === 'true';
    
    // 메타데이터에서 요약 및 키워드 추출
    const summary = sessionData.summary || '요약이 제공되지 않았습니다.';
    const keywords = (sessionData.metadata?.keywords || []) as string[];
    
    const url = sessionData.url || '';
    const title = sessionData.title || '대화';
    const messages = sessionData.messages || [];
    const metadata = sessionData.metadata || {};
    
    const summaryResult = {
      summary,
      keywords
    };
    
    // 화면에 표시할 ConversationResult 컴포넌트 반환
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-5xl mx-auto">
            {/* 헤더 섹션 */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2 sm:mb-4">
                대화 저장 완료
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
                {isDuplicate ? '중복된 대화를 확인합니다.' : '성공적으로 대화가 저장되었습니다.'}
              </p>
            </div>
            
            {/* 버튼 컨테이너 */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
              <Link 
                href="/" 
                className="w-full sm:w-auto group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M9 6l-6 6 6 6"/></svg>
                  메인 페이지로 돌아가기
                </span>
              </Link>
              
              <Link 
                href="/rag" 
                className="w-full sm:w-auto group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  RAG 벡터 검색으로 이동
                </span>
              </Link>
            </div>
            
            {/* 결과 표시 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-100 dark:border-gray-700">
              <ConversationResult 
                title={title}
                url={url}
                id={id}
                duplicate={isDuplicate}
                summaryResult={summaryResult}
                rawText={messages.map(msg => `[${msg.role}]: ${msg.content}`).join('\n\n')}
                conversation={{
                  title,
                  messages: messages as ChatMessage[],
                  metadata
                }}
              />
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('세션 데이터 가져오기 오류:', error);
    // 오류 발생 시 메인 페이지로 리다이렉트
    redirect('/');
  }
} 