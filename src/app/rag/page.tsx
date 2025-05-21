'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RagResponse } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import HomeLogoButton from '@/components/HomeLogoButton';

// 채팅 메시지 타입 정의
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    title: string;
    content: string;
    url?: string;
    similarity?: number;
  }[];
  summary?: string;
  hasSourceContext?: boolean;
}

export default function RagPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 메시지 목록이 업데이트될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  // 페이지 로드 시 input에 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // 질의응답 함수
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // 사용자 메시지 추가
    const userMessageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError(null);
    
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
      
      // 어시스턴트 메시지 추가
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: data.data.answer,
        timestamp: new Date(),
        sources: data.data.sources || [],
        summary: data.data.summary,
        hasSourceContext: data.data.hasSourceContext === true ? true : false
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      
      // 오류 메시지를 어시스턴트 메시지로 추가
      if (error) {
        const errorMessageId = (Date.now() + 1).toString();
        const errorMessage: ChatMessage = {
          id: errorMessageId,
          role: 'assistant',
          content: `오류가 발생했습니다: ${error}`,
          timestamp: new Date(),
          hasSourceContext: false
        };
        
        setChatHistory(prev => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
      // 응답 후 입력창에 포커스
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // 소스 보기 토글
  const toggleSources = (messageId: string) => {
    setActiveMessageId(prev => prev === messageId ? null : messageId);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* 홈 로고 버튼 */}
      <HomeLogoButton />
      
      <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 pt-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          {/* 헤더 섹션 */}
          <div className="text-center mb-3 sm:mb-6">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-1 sm:mb-2"
            >
              PKM 챗봇
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300"
            >
              저장된 지식 기반으로 질문에 답변해 드립니다
            </motion.p>
          </div>
          
          {/* 챗봇 컨테이너 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-[70vh] sm:h-[72vh]"
          >
            {/* 챗봇 헤더 */}
            <div className="p-2 sm:p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 flex items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 sm:mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-xs sm:text-sm md:text-base text-gray-900 dark:text-white">PKM 어시스턴트</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">저장된 대화 기반 질의응답 시스템</p>
              </div>
              <div className="ml-auto flex items-center">
                <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full mr-1"></span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">온라인</span>
              </div>
            </div>
            
            {/* 채팅 메시지 컨테이너 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4"
            >
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-medium text-gray-800 dark:text-white mb-2">
                    PKM 챗봇에게 질문해 보세요
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md px-2">
                    저장된 대화 데이터를 기반으로 질문에 답변해 드립니다. 필요한 정보가 있으면 언제든 물어보세요!
                  </p>
                </div>
              ) : (
                <>
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-2 sm:p-3 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="prose-sm sm:prose dark:prose-invert text-xs sm:text-sm md:text-base">{message.content}</div>

                        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">
                            <button
                              onClick={() => toggleSources(message.id)}
                              className="flex items-center text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-300 hover:underline"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1 transition-transform ${
                                  activeMessageId === message.id ? 'rotate-180' : ''
                                }`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                              {activeMessageId === message.id ? '소스 숨기기' : '소스 보기'} ({message.sources.length})
                            </button>

                            <AnimatePresence>
                              {activeMessageId === message.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-2 space-y-2"
                                >
                                  {message.sources.map((source, index) => (
                                    <div key={index} className="bg-slate-300/50 dark:bg-slate-600/50 p-2 rounded-lg text-[10px] sm:text-xs">
                                      <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                          {source.title || `소스 ${index + 1}`}
                                        </h4>
                                        {source.similarity && (
                                          <span className="ml-1 px-1.5 py-0.5 bg-slate-400/30 dark:bg-slate-500/30 rounded text-[8px] sm:text-[10px]">
                                            {Math.round(source.similarity * 100)}% 일치
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-slate-700 dark:text-slate-300 mb-1 line-clamp-3">
                                        {source.content}
                                      </p>
                                      {source.url && (
                                        <a
                                          href={source.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-2.5 w-2.5 mr-0.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                          </svg>
                                          원본 보기
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {/* 입력창 섹션 */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-2 sm:p-3 md:p-4">
              <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="질문을 입력하세요..."
                  className="flex-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 sm:py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
} 