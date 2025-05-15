'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types';
import SaveToObsidianButton from './SaveToObsidianButton';

// 로컬 타입 정의
interface SummaryData {
  summary: string;
  keywords: string[];
  modelUsed?: string;
}

export interface ConversationResultProps {
  title: string;
  url: string;
  id?: string;
  rawText: string;
  summaryResult: SummaryData;
  duplicate?: boolean;
  conversation: {
    title: string;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
  };
}

export default function ConversationResult({
  title,
  url,
  id,
  rawText,
  summaryResult,
  duplicate = false,
  conversation
}: ConversationResultProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className="my-8 bg-background border rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-1">
              {duplicate ? '이미 저장된 대화입니다.' : '대화 저장이 완료되었습니다.'}
            </p>
          </div>
          
          {isClient && (
            <SaveToObsidianButton
              conversation={conversation}
              summaryResult={summaryResult}
              rawText={rawText}
              url={url}
            />
          )}
        </div>
        
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">요약</h3>
            <div className="p-4 bg-muted rounded-md">
              <p>{summaryResult.summary}</p>
            </div>
          </div>
          
          {summaryResult.keywords && summaryResult.keywords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">키워드</h3>
              <div className="flex flex-wrap gap-2">
                {summaryResult.keywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2">메시지</h3>
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                {conversation.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`p-4 ${
                      message.role === 'user' 
                        ? 'bg-muted/50' 
                        : 'bg-background'
                    } ${
                      index !== conversation.messages.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="font-medium text-sm mb-2">
                      {message.role === 'user' ? '👤 사용자' : '🤖 어시스턴트'}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-8">
            <button
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
              onClick={() => router.push('/')}
            >
              홈으로 돌아가기
            </button>
            
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              원본 대화 보기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 