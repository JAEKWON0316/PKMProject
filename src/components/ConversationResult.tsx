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
    <div className="my-4 sm:my-8 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{title}</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300 mt-1">
              {duplicate ? '이미 저장된 대화입니다.' : '대화 저장이 완료되었습니다.'}
            </p>
          </div>
          
          {isClient && (
            <div className="w-full sm:w-auto">
              <SaveToObsidianButton
                conversation={conversation}
                summaryResult={summaryResult}
                rawText={rawText}
                url={url}
              />
            </div>
          )}
        </div>
        
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-800 dark:text-slate-200">요약</h3>
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-100 dark:border-slate-700">
              <p className="text-sm sm:text-base text-gray-700 dark:text-slate-300">{summaryResult.summary}</p>
            </div>
          </div>
          
          {summaryResult.keywords && summaryResult.keywords.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-800 dark:text-slate-200">키워드</h3>
              <div className="flex flex-wrap gap-2">
                {summaryResult.keywords.map((keyword, index) => (
                  <span key={index} className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-800 dark:text-slate-200">메시지</h3>
            <div className="border border-gray-100 dark:border-slate-700 rounded-md overflow-hidden">
              <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {conversation.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`p-3 sm:p-4 ${
                      message.role === 'user' 
                        ? 'bg-gray-50 dark:bg-slate-800' 
                        : 'bg-white dark:bg-slate-900'
                    } ${
                      index !== conversation.messages.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
                    }`}
                  >
                    <div className="font-medium text-xs sm:text-sm mb-2 text-gray-700 dark:text-slate-300">
                      {message.role === 'user' ? '👤 사용자' : '🤖 어시스턴트'}
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-slate-200">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-8">
            <button
              className="w-full sm:w-auto px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md text-sm font-medium transition-colors"
              onClick={() => router.push('/')}
            >
              홈으로 돌아가기
            </button>
            
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              원본 대화 보기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 