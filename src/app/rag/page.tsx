'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RagResponse } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

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

  // 소스 보기 토글 - 수정된 코드
  const toggleSources = (messageId: string) => {
    setActiveMessageId(prev => prev === messageId ? null : messageId);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 sm:py-16 pt-20 md:pt-28">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          {/* 헤더 섹션 */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2"
            >
              PKM 챗봇
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg text-gray-600 dark:text-gray-300"
            >
              저장된 지식 기반으로 질문에 답변해 드립니다
            </motion.p>
          </div>
          
          {/* 버튼 컨테이너 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex justify-center gap-4 mb-6"
          >
            <Link 
              href="/" 
              className="group relative overflow-hidden px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M9 6l-6 6 6 6"/></svg>
                메인 페이지로 돌아가기
              </span>
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              ></motion.span>
            </Link>
          </motion.div>
          
          {/* 챗봇 컨테이너 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-[70vh]"
          >
            {/* 챗봇 헤더 */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">PKM 어시스턴트</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">저장된 대화 기반 질의응답 시스템</p>
              </div>
              <div className="ml-auto flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">온라인</span>
              </div>
            </div>
            
            {/* 채팅 메시지 영역 */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </motion.div>
                  <motion.h3 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-xl font-semibold text-gray-800 dark:text-white mb-2"
                  >
                    안녕하세요! 무엇을 도와드릴까요?
                  </motion.h3>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-gray-600 dark:text-gray-300 max-w-md"
                  >
                    저장된 대화 내용을 기반으로 질문에 답변합니다. 질문을 입력하면 관련 정보를 찾아 답변해 드립니다.
                  </motion.p>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-6 space-y-2"
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">다음과 같은 질문을 해보세요:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['프로젝트에 대해 알려줘', '벡터 데이터베이스란?', 'RAG 시스템의 장점은?'].map((suggestion, i) => (
                        <button 
                          key={i}
                          onClick={() => setQuery(suggestion)}
                          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                chatHistory.map((message) => (
                  <motion.div 
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${message.role === 'user' ? 
                      'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm'
                    } p-4 shadow-sm`}>
                      <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {message.sources && message.sources.length > 0 && message.hasSourceContext === true && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleSources(message.id)}
                            className="text-xs font-medium hover:underline flex items-center gap-1 mt-2 text-blue-200 dark:text-blue-300"
                          >
                            {activeMessageId === message.id ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                                소스 숨기기 ({message.sources.length})
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                                소스 보기 ({message.sources.length})
                              </>
                            )}
                          </button>
                          
                          <AnimatePresence>
                            {activeMessageId === message.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2"
                              >
                                {message.summary && (
                                  <div className="text-xs bg-indigo-100/50 dark:bg-indigo-900/20 p-3 rounded mb-2">
                                    <div className="font-medium mb-1 flex items-center text-indigo-700 dark:text-indigo-300">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                      </svg>
                                      요약
                                    </div>
                                    <div className="text-gray-800 dark:text-gray-200 italic">
                                      {message.summary}
                                    </div>
                                  </div>
                                )}
                                
                                {message.sources.map((source, index) => (
                                  <div key={index} className="text-xs bg-black/10 dark:bg-white/5 p-3 rounded hover:bg-black/15 dark:hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                      {source.url ? (
                                        <a 
                                          href={source.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="font-medium text-blue-400 hover:text-blue-300 flex items-center group"
                                        >
                                          <span className="border-b border-transparent group-hover:border-blue-300 transition-colors">
                                            {source.title || '제목 없음'}
                                          </span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                          </svg>
                                        </a>
                                      ) : (
                                        <div className="font-medium">{source.title || '제목 없음'}</div>
                                      )}
                                      {source.similarity !== undefined && (
                                        <div className="text-2xs opacity-70 ml-2 flex-shrink-0">유사도: {(source.similarity * 100).toFixed(1)}%</div>
                                      )}
                                    </div>
                                    <div className="line-clamp-3 text-gray-700 dark:text-gray-300">
                                      {source.content}
                                    </div>
                                    {source.url && (
                                      <div className="mt-2 text-2xs text-gray-500 dark:text-gray-400 truncate">
                                        <span className="opacity-70">URL: </span>
                                        <a 
                                          href={source.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                          {source.url.length > 40 ? `${source.url.substring(0, 40)}...` : source.url}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center ml-2 flex-shrink-0 self-end mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              
              {/* 로딩 표시기 */}
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* 입력 영역 */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4">
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="질문을 입력하세요..."
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
              
              {error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                질문을 입력하면 저장된 지식 기반으로 답변합니다
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
} 