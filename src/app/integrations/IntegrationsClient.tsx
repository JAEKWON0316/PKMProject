"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import SearchBar, { SearchMode } from "@/components/SearchBar"
import IntegrationGrid from "@/components/IntegrationGrid"
import Pagination from "@/components/Pagination"
import { ChatSession } from "@/types"
import { useAuth } from "@/contexts/AuthContext"

const ITEMS_PER_PAGE = 30

interface IntegrationsData {
  sessions: Partial<ChatSession>[];
  userChatCount: number;
  categoryCounts: Record<string, number>;
  isAuthenticated: boolean;
}

export default function IntegrationsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  
  // URL에서 초기 상태 가져오기
  const initialCategory = searchParams.get('category') || 'All'
  const initialQuery = searchParams.get('q') || ''
  const initialMode = (searchParams.get('mode') as SearchMode) || 'both'
  
  // 상태 관리
  const [category, setCategory] = useState<string>(initialCategory)
  const [query, setQuery] = useState<string>(initialQuery)
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode)
  const [page, setPage] = useState<number>(1)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [data, setData] = useState<IntegrationsData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // URL 업데이트 함수
  const updateUrlWithCategory = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newCategory === 'All') {
      params.delete('category')
    } else {
      params.set('category', newCategory)
    }
    router.push(`/integrations?${params.toString()}`)
  }

  // API에서 데이터 가져오기
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = new URL('/api/integrations', window.location.origin)
      if (user?.id) {
        url.searchParams.set('userId', user.id)
      }
      
      console.log('API 호출:', url.toString())
      
      const response = await fetch(url.toString())
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '데이터를 불러올 수 없습니다.')
      }
      
      setData(result.data)
      console.log('데이터 로드 완료:', result.data)
      
    } catch (err) {
      console.error('데이터 로딩 오류:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 초기 데이터 로딩 및 사용자 변경 시 재로딩
  useEffect(() => {
    fetchData()
  }, [user?.id])
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    updateUrlWithCategory(newCategory)
    setPage(1)
  }
  
  // 검색어 변경 핸들러
  const handleSearch = (newQuery: string, newMode: SearchMode) => {
    setIsSearching(newQuery.length > 0)
    setQuery(newQuery)
    setSearchMode(newMode)
    setPage(1)
  }
  
  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    fetchData()
  }

  // 메인 카테고리 목록 생성
  const mainCategories = useMemo(() => {
    if (!data) return ['All']
    
    const categories = ['All']
    
    // 로그인한 사용자에게만 "내 대화" 카테고리 추가
    if (data.isAuthenticated) {
      categories.push('내 대화')
    }
    
    // 모든 카테고리를 추가 (수가 0인 것도 포함)
    Object.keys(data.categoryCounts).forEach(cat => {
      if (cat !== 'All' && cat !== '내 대화') {
        categories.push(cat)
      }
    })
    
    return categories
  }, [data])

  // 카테고리와 검색어로 세션 필터링
  const filteredSessions = useMemo(() => {
    if (!data) return []
    
    return data.sessions.filter(session => {
      // 카테고리 필터링
      let categoryMatch = false;
      
      if (category === "All") {
        categoryMatch = true;
      } else if (category === "내 대화") {
        categoryMatch = !!(data.isAuthenticated && user?.id && session.user_id === user.id);
      } else {
        categoryMatch = session.metadata?.mainCategory === category;
      }
      
      // 검색어 필터링
      let searchMatch = !query;
      
      if (query) {
        const queryLower = query.toLowerCase();
        
        if (searchMode === "title") {
          searchMatch = !!(session.title && session.title.toLowerCase().includes(queryLower));
        } else if (searchMode === "summary") {
          searchMatch = !!(session.summary && session.summary.toLowerCase().includes(queryLower));
        } else { // both
          searchMatch = !!(
            (session.title && session.title.toLowerCase().includes(queryLower)) || 
            (session.summary && session.summary.toLowerCase().includes(queryLower))
          );
        }
      }
      
      return categoryMatch && searchMatch;
    });
  }, [data, category, query, searchMode, user?.id]);
  
  // 페이지네이션
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">PKM AI</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-red-400 mb-4">오류가 발생했습니다</p>
            <p className="text-gray-300 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* 왼쪽 사이드바 - 카테고리 필터 */}
      <div className="w-64 hidden md:block bg-gray-800 border-r border-gray-700 overflow-auto pt-20 md:pt-28">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">카테고리</h2>
            <button 
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="새로고침"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {mainCategories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center ${
                  category === cat
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span>{cat}</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                  {data.categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto pt-20 md:pt-28 pb-4 px-3 sm:px-4 md:px-6">
        {/* 헤더 텍스트 */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-purple-500 mb-1">대화 찾아보기</h1>
          <p className="text-gray-300">공유한 내역들을 확인해보세요.</p>
        </div>

        {/* 모바일 카테고리 선택 */}
        <div className="mb-4 md:hidden">
          <div className="relative">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm appearance-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {mainCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({data.categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 검색창 */}
        <div className="mb-6 border-b">
          <SearchBar 
            onSearch={handleSearch}
            initialValue={initialQuery}
            initialMode={initialMode}
          />
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
            {query && (
              <div className="text-sm text-gray-400">
                <span>
                  {searchMode === "title" ? "제목" : 
                   searchMode === "summary" ? "요약" : "제목+요약"}
                </span>
                <span>에서 </span>
                <span className="text-gray-300">"{query}"</span>
                <span> 검색 중</span>
                {isSearching && <span className="ml-2 animate-pulse">🔍</span>}
              </div>
            )}
          </div>
        
          {filteredSessions.length > 0 ? (
            <>
              <IntegrationGrid chatSessions={paginatedSessions} integrations={[]} />
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              {query ? (
                <div>
                  <p className="text-xl mb-2">
                    {searchMode === "title" ? "제목" : 
                     searchMode === "summary" ? "요약" : "제목 또는 요약"}
                    에 "{query}"가 포함된 대화가 없습니다
                  </p>
                  <p className="text-sm">다른 검색어를 시도하거나 검색 모드를 변경해보세요</p>
                </div>
              ) : (
                <p className="text-xl">이 카테고리에 대화가 없습니다</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 