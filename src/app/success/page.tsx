import { redirect } from 'next/navigation';
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
      <main className="container mx-auto py-8 px-4">
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
      </main>
    );
  } catch (error) {
    console.error('세션 데이터 가져오기 오류:', error);
    // 오류 발생 시 메인 페이지로 리다이렉트
    redirect('/');
  }
} 