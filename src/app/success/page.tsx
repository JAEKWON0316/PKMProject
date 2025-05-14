import { redirect } from 'next/navigation';
import ConversationResult from '@/components/ConversationResult';
import { getChatSessionById } from '@/utils/supabaseHandler';
import { ChatMessage } from '@/types';

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
  const { title, url, id } = searchParams;
  
  if (!title || !url) {
    redirect('/');
  }
  
  // 파라미터 파싱
  const isDuplicate = searchParams.duplicate === 'true';
  
  let parsedSummary = {
    summary: searchParams.summary || '요약이 제공되지 않았습니다.',
    keywords: searchParams.keywords ? searchParams.keywords.split(',') : [],
    modelUsed: 'gpt-4.1-nano'
  };
  
  let parsedMessages: ChatMessage[] = [];
  let rawText: string = '';
  let parsedMetadata: Record<string, any> = {};
  
  // id가 있으면 Supabase에서 세션 데이터 가져오기
  if (id) {
    try {
      const sessionData = await getChatSessionById(id);
      if (sessionData) {
        // URL 파라미터로 받은 요약이 없을 경우에만 DB에서 가져온 요약 사용
        if (!searchParams.summary && sessionData.summary) {
          parsedSummary.summary = sessionData.summary;
        }
        
        // DB에 저장된 메시지 사용
        parsedMessages = sessionData.messages || [];
        
        // 메타데이터 사용
        parsedMetadata = sessionData.metadata || {};
      }
    } catch (error) {
      console.error('세션 데이터 로드 오류:', error);
      
      // 오류가 발생해도 기본 정보는 표시할 수 있도록 처리
      // Supabase에 저장 옵션을 선택하지 않은 경우 등에 대비
      parsedMessages = [{
        role: 'system',
        content: '세션 데이터를 로드할 수 없습니다. Supabase에 데이터가 저장되지 않았거나 다른 문제가 발생했습니다.'
      }];
    }
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">대화 저장 완료</h1>
      
      <ConversationResult
        title={title}
        url={url}
        messages={parsedMessages}
        rawText={rawText}
        summary={parsedSummary}
        duplicate={isDuplicate}
        metadata={parsedMetadata}
      />
    </div>
  );
} 