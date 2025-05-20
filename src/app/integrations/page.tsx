"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { categories as oldCategories, integrations, type Integration } from "@/app/data/integrations"
import SearchBar, { SearchMode } from "@/components/SearchBar"
import IntegrationGrid from "@/components/IntegrationGrid"
import Pagination from "@/components/Pagination"
import { getAllChatSessions } from "@/utils/supabaseHandler"
import { ChatSession } from "@/types"
import { PREDEFINED_CATEGORIES } from "@/utils/categoryClassifier"

// 메인 카테고리 목록 (정의된 카테고리 사용)
const mainCategories = [
  "All",
  ...PREDEFINED_CATEGORIES
];

const ITEMS_PER_PAGE = 30

// 정적 렌더링을 하지 않도록 설정 (빌드 시 사전 렌더링 방지)
export const dynamic = 'force-dynamic'

// 페이지 컴포넌트를 두 부분으로 분리합니다
export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden justify-center items-center">
        <div className="text-center py-16 text-gray-400">
          <p className="text-xl">로딩 중...</p>
        </div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}

// useSearchParams를 사용하는 실제 컨텐츠 컴포넌트
function IntegrationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL 파라미터 가져오기 (초기값으로만 사용)
  const initialCategory = searchParams.get("category") || "All"
  const initialQuery = searchParams.get("query") || ""
  const initialPage = Number(searchParams.get("page") || "1")
  const initialMode = (searchParams.get("mode") || "title") as SearchMode
  
  // 로컬 상태 관리
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(initialPage)
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode)
  const [isSearching, setIsSearching] = useState(false)
  
  const [chatSessions, setChatSessions] = useState<Partial<ChatSession>[]>([])
  const [loading, setLoading] = useState(true)

  // URL 동기화 - 카테고리 변경시에만 URL 업데이트
  const updateUrlWithCategory = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newCategory === "All") {
      params.delete("category")
    } else {
      params.set("category", newCategory)
    }
    
    // 쿼리 파라미터 유지 (필요시)
    if (query) {
      params.set("query", query)
      params.set("mode", searchMode)
    } else {
      params.delete("query")
      params.delete("mode")
    }
    
    // 페이지 초기화
    params.delete("page")
    setPage(1)
    
    // URL 업데이트
    router.push(`/integrations?${params.toString()}`)
  }

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
          
          // 카테고리 처리
          if (!session.metadata.mainCategory || !PREDEFINED_CATEGORIES.includes(session.metadata.mainCategory)) {
            // 제목과 요약을 기반으로 간단한 카테고리 추측
            const content = `${session.title || ''} ${session.summary || ''}`.toLowerCase();
            
            let guessedCategory = "기타";
            
            // 간단한 키워드 매칭으로 카테고리 추측 (임시 방편)
            if (/코딩|개발|프로그래밍|코드|javascript|python|api|서버|앱/.test(content)) {
              guessedCategory = "개발";
            } else if (/학습|공부|교육|강의|수업|학교|과제/.test(content)) {
              guessedCategory = "학습";
            } else if (/비즈니스|업무|회의|프로젝트|업무|기획|보고서/.test(content)) {
              guessedCategory = "업무";
            } else if (/디자인|창작|그림|음악|콘텐츠|예술|작성/.test(content)) {
              guessedCategory = "창작";
            } else if (/게임|영화|취미|독서|음악|취미|여가/.test(content)) {
              guessedCategory = "취미";
            } else if (/가정|생활|요리|쇼핑|일상|집안/.test(content)) {
              guessedCategory = "생활";
            } else if (/운동|건강|다이어트|식단|질병|의료/.test(content)) {
              guessedCategory = "건강";
            } else if (/여행|관광|휴가|호텔|여행지|숙소/.test(content)) {
              guessedCategory = "여행";
            } else if (/금융|투자|주식|부동산|재테크|경제/.test(content)) {
              guessedCategory = "경제";
            } else if (/기술|ai|인공지능|블록체인|iot|가상현실/.test(content)) {
              guessedCategory = "기술";
            }
            
            session.metadata.mainCategory = guessedCategory;
          }
          
          // 메시지 수 추가
          if (session.messages && Array.isArray(session.messages)) {
            session.metadata.messageCount = session.messages.length;
          }
          
          return session;
        });
        
        setChatSessions(processedSessions);
      } catch (error) {
        console.error("채팅 세션 가져오기 오류:", error);
        // 오류 발생 시 빈 배열 설정
        setChatSessions([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchChatSessions();
  }, []);
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    updateUrlWithCategory(newCategory)
  }
  
  // 검색어 변경 핸들러
  const handleSearch = (newQuery: string, newMode: SearchMode) => {
    setIsSearching(newQuery.length > 0)
    setQuery(newQuery)
    setSearchMode(newMode)
    setPage(1) // 검색시 페이지 초기화
  }
  
  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // 카테고리와 검색어로 채팅 세션 필터링
  const filteredSessions = chatSessions.filter(session => {
    // 카테고리 필터링
    const categoryMatch = category === "All" || 
      (session.metadata?.mainCategory === category);
    
    // 검색어 필터링 (검색 모드에 따라 다르게 적용)
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
  
  // 카테고리별 세션 수 계산
  const categoryCounts = mainCategories.reduce<Record<string, number>>((acc, cat) => {
    if (cat === "All") {
      acc[cat] = chatSessions.length;
    } else {
      acc[cat] = chatSessions.filter(session => 
        session.metadata?.mainCategory === cat
      ).length;
    }
    return acc;
  }, {});
  
  // 페이지네이션
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* 왼쪽 사이드바 - 카테고리 필터 */}
      <div className="w-64 hidden md:block bg-gray-800 border-r border-gray-700 overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">카테고리</h2>
          <div className="space-y-1">
            {mainCategories.map(cat => {
              return (
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
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">대화 찾아보기</h1>
          <SearchBar 
            onSearch={handleSearch} 
            initialValue={query} 
            initialMode={searchMode} 
          />
        </div>

        {/* 모바일 전용 카테고리 필터 */}
        <div className="md:hidden p-4 border-b border-gray-700 overflow-x-auto">
          <div className="flex space-x-2">
            {mainCategories.map(cat => {
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap flex items-center space-x-1 ${
                    category === cat
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-300 border border-gray-700"
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-xs bg-gray-700 px-1.5 rounded-full">
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              );
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

          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-xl">대화를 불러오는 중...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
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
