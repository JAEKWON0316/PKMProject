"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SaveToObsidianButton from '@/components/SaveToObsidianButton'
import { FloatingPaper } from '@/components/floating-paper'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SaveChat() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saveOptions] = useState({
    saveToSupabase: true,
    saveToObsidian: false,
    saveAsJson: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setResult(null)

    try {
      console.log(`Submitting URL: ${url}`)
      console.log('Save options:', saveOptions)
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          options: saveOptions 
        }),
      })

      const data = await response.json()
      console.log('API response:', data)

      if (!data.success) {
        throw new Error(data.error || '대화 처리 중 오류가 발생했습니다.')
      }

      setSuccess(true)
      
      // 중복 URL 처리
      if (data.duplicate) {
        // 중복 URL인 경우 성공 페이지로 리다이렉트
        console.log('중복 URL 감지, 성공 페이지로 리다이렉트:', data);
        window.location.href = `/success?id=${data.id || ''}&duplicate=true`;
      } else {
        setResult(data)
        
        // 성공 페이지로 리다이렉트
        console.log('저장 성공, 성공 페이지로 리다이렉트:', data);
        window.location.href = `/success?id=${data.id || ''}`;
      }
      
      setUrl('')
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 pt-20 md:pt-28">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* 헤더 섹션 */}
          <div className="text-center mb-6 sm:mb-10">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2 sm:mb-4"
            >
              PKM Project
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300"
            >
              ChatGPT 공유 기능 기반 지식 관리 시스템
            </motion.p>
          </div>

          {/* 버튼 컨테이너 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex justify-center gap-4 mb-6 sm:mb-8"
          >
            <Link 
              href="/rag" 
              className="group relative overflow-hidden px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm sm:text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="relative z-10">RAG 벡터 검색</span>
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: "100%" }}
                whileHover={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              ></motion.span>
            </Link>
          </motion.div>

          {/* URL 입력 폼 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto"
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 dark:text-white">대화 저장하기</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="url" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  ChatGPT 공유 링크
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://chatgpt.com/share/..."
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white text-sm transition-all duration-200 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ChatGPT에서 공유한 링크를 입력하세요.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      처리 중...
                    </>
                  ) : (
                    '대화 저장하기'
                  )}
                </button>
              </div>
              
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}
              
              {success && !error && result && (
                <div className="p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs sm:text-sm">
                  {result.duplicate ? (
                    <p>이미 저장된 대화입니다.</p>
                  ) : (
                    <p>대화가 성공적으로 저장되었습니다.</p>
                  )}
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
} 