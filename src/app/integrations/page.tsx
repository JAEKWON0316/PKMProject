"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { categories, integrations, type Integration } from "@/app/data/integrations"
import SearchBar from "@/components/SearchBar"
import IntegrationGrid from "@/components/IntegrationGrid"
import Pagination from "@/components/Pagination"
import { getAllChatSessions } from "@/utils/supabaseHandler"
import { ChatSession } from "@/types"

// 메인 카테고리 목록 (기존 카테고리 + 대화용 카테고리)
const mainCategories = [
  "All",
  "개발",
  "창작",
  "학습",
  "업무",
  "취미",
  "생활",
  "건강",
  ...categories.filter(cat => cat !== "All"),
]

const ITEMS_PER_PAGE = 30

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL 파라미터 가져오기
  const category = searchParams.get("category") || "All"
  const query = searchParams.get("query") || ""
  const page = Number(searchParams.get("page") || "1")
  
  const [chatSessions, setChatSessions] = useState<Partial<ChatSession>[]>([])
  const [loading, setLoading] = useState(true)

  // Supabase에서 채팅 세션 가져오기
  useEffect(() => {
    async function fetchChatSessions() {
      try {
        setLoading(true)
        const sessions = await getAllChatSessions()
        
        // 메타데이터 처리
        const processedSessions = sessions.map(session => {
          // 메타데이터가 없으면 기본값 설정
          if (!session.metadata) {
            session.metadata = { mainCategory: "기타", tags: [] }
          }
          
          // 카테고리가 없으면 기타로 설정
          if (!session.metadata.mainCategory) {
            session.metadata.mainCategory = "기타"
          }
          
          // 메시지 수 추가
          if (session.messages && Array.isArray(session.messages)) {
            session.metadata.messageCount = session.messages.length
          }
          
          return session
        })
        
        setChatSessions(processedSessions)
      } catch (error) {
        console.error("채팅 세션 가져오기 오류:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchChatSessions()
  }, [])
  
  // 카테고리와 검색어로 채팅 세션 필터링
  const filteredSessions = chatSessions.filter(session => {
    // 카테고리 필터링
    const categoryMatch = category === "All" || 
      (session.metadata?.mainCategory === category)
    
    // 검색어 필터링
    const searchMatch = !query || 
      (session.title && session.title.toLowerCase().includes(query.toLowerCase())) ||
      (session.summary && session.summary.toLowerCase().includes(query.toLowerCase()))
    
    return categoryMatch && searchMatch
  })
  
  // 페이지네이션
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE)
  const paginatedSessions = filteredSessions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* 왼쪽 사이드바 - 카테고리 필터 */}
      <div className="w-64 hidden md:block bg-gray-800 border-r border-gray-700 overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">카테고리</h2>
          <div className="space-y-1">
            {mainCategories.map(cat => {
              // URL 생성
              const params = new URLSearchParams(searchParams.toString())
              if (cat === "All") {
                params.delete("category")
              } else {
                params.set("category", cat)
              }
              params.delete("page")
              const href = `/integrations?${params.toString()}`
              
              return (
                <button
                  key={cat}
                  onClick={() => router.push(href)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    category === cat
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">대화 찾아보기</h1>
          <SearchBar />
        </div>

        {/* 모바일 전용 카테고리 필터 */}
        <div className="md:hidden p-4 border-b border-gray-700 overflow-x-auto">
          <div className="flex space-x-2">
            {mainCategories.map(cat => {
              // URL 생성
              const params = new URLSearchParams(searchParams.toString())
              if (cat === "All") {
                params.delete("category")
              } else {
                params.set("category", cat)
              }
              params.delete("page")
              const href = `/integrations?${params.toString()}`
              
              return (
                <button
                  key={cat}
                  onClick={() => router.push(href)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    category === cat
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-300 border border-gray-700"
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* 대화 목록 영역 */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">{category}</span>
              <span className="text-sm text-gray-400 ml-2">
                ({filteredSessions.length}개 대화)
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-xl">대화를 불러오는 중...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <IntegrationGrid chatSessions={paginatedSessions} integrations={[]} />
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-xl">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 페이지네이션 */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              currentCategory={category}
              searchQuery={query}
            />
          </div>
        )}
      </div>
    </div>
  )
}
