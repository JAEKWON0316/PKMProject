import type { Integration } from "@/app/data/integrations"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Clock, Star, LucideIcon } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { ChatSession } from "@/types"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getSupabaseClient } from "@/lib/supabase"

type IntegrationCardProps = {
  integration: Integration & { url?: string; chatSession?: Partial<ChatSession> }
  categoryCount?: number
  onFavoriteToggle?: () => void
}

// 카테고리별 색상 매핑
const categoryColors: Record<string, string> = {
  "개발": "#3b82f6", // blue-500
  "창작": "#ec4899", // pink-500
  "학습": "#8b5cf6", // violet-500
  "업무": "#10b981", // emerald-500
  "취미": "#f59e0b", // amber-500
  "생활": "#6366f1", // indigo-500
  "건강": "#ef4444", // red-500
  "기타": "#64748b", // slate-500
  "여행": "#0ea5e9", // sky-500
  "기술": "#a855f7", // purple-500
  "경제": "#f97316", // orange-500
  "Analytics": "#3b82f6",
  "Marketing": "#ec4899",
  "Productivity": "#8b5cf6",
  "Sales": "#10b981",
  "Finance": "#f59e0b",
  "Communication": "#6366f1",
  "Cloud Services": "#ef4444",
  "Security": "#64748b",
  "Design": "#a855f7",
  "Development": "#06b6d4",
  "Human Resources": "#84cc16",
  "Customer Support": "#14b8a6",
  "E-commerce": "#f43f5e",
  "Social Media": "#8b5cf6"
}

export default function IntegrationCard({ integration, categoryCount, onFavoriteToggle }: IntegrationCardProps) {
  const { user, isAuthenticated } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [favoriteState, setFavoriteState] = useState(
    integration.chatSession?.metadata?.favorite || false
  )
  
  // Icon 타입을 LucideIcon으로 명시적으로 지정합니다
  const Icon = integration.icon as React.ElementType
  const chatSession = integration.chatSession
  
  // 대화 세션이 있으면 해당 정보 사용, 없으면 통합 정보 사용
  const title = chatSession?.title || integration.name
  const summary = chatSession?.summary || integration.description
  const category = chatSession?.metadata?.mainCategory || integration.category
  const subCategory = chatSession?.metadata?.subCategory || ""
  const created_at = chatSession?.created_at
  const tags = (chatSession?.metadata?.tags || []) as string[]
  const messageCount = chatSession?.metadata?.messageCount || "?"
  
  // URL 구성
  const url = chatSession ? `/success?id=${chatSession.id}` : (integration.url || '#')
  
  // 색상 설정
  const color = categoryColors[category] || integration.color || "#64748b"
  
  // 시간 포맷팅
  const formattedDate = created_at 
    ? formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ko }) 
    : null

  // 즐겨찾기 토글 핸들러
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    // 이벤트 전파 완전 차단
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    console.log('🔄 즐겨찾기 토글 시작:', {
      isAuthenticated,
      chatSessionId: chatSession?.id,
      chatSessionUserId: chatSession?.user_id, // 세션 소유자 ID
      currentUserId: user?.id, // 현재 로그인한 사용자 ID
      currentFavorite: favoriteState,
      isUpdating
    })
    
    // 로그인하지 않은 경우 알림 표시
    if (!isAuthenticated) {
      alert('즐겨찾기 기능은 로그인 후 이용할 수 있습니다.')
      return
    }
    
    if (!chatSession?.id || isUpdating) {
      console.warn('❌ 즐겨찾기 토글 조건 불충족:', {
        chatSessionId: chatSession?.id,
        isUpdating
      })
      return
    }

    const newFavoriteState = !favoriteState
    setIsUpdating(true)
    
    console.log('📝 즐겨찾기 상태 변경:', {
      from: favoriteState,
      to: newFavoriteState,
      sessionId: chatSession.id,
      sessionOwnerId: chatSession.user_id,
      currentUserId: user?.id
    })
    
    // Optimistic update
    setFavoriteState(newFavoriteState)
    
    try {
      // Supabase 클라이언트를 직접 사용하여 업데이트
      const supabase = getSupabaseClient()
      
      console.log('🔍 Supabase 업데이트 시도:', {
        sessionId: chatSession.id,
        currentUserId: user?.id,
        newFavoriteState,
        action: newFavoriteState ? 'INSERT' : 'DELETE'
      })
      
      if (newFavoriteState) {
        // 즐겨찾기 추가
        const { data, error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user?.id,
            session_id: chatSession.id
          })
          .select('id')

        if (error) {
          console.error('❌ 즐겨찾기 추가 에러:', {
            error,
            errorCode: error.code,
            errorMessage: error.message,
            sessionId: chatSession.id,
            userId: user?.id
          })
          throw new Error(`즐겨찾기 추가 실패: ${error.message}`)
        }
        
        console.log('✅ 즐겨찾기 추가 성공:', {
          data,
          sessionId: chatSession.id,
          userId: user?.id
        })
      } else {
        // 즐겨찾기 제거
        const { data, error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('session_id', chatSession.id)
          .select('id')

        if (error) {
          console.error('❌ 즐겨찾기 제거 에러:', {
            error,
            errorCode: error.code,
            errorMessage: error.message,
            sessionId: chatSession.id,
            userId: user?.id
          })
          throw new Error(`즐겨찾기 제거 실패: ${error.message}`)
        }
        
        console.log('✅ 즐겨찾기 제거 성공:', {
          data,
          sessionId: chatSession.id,
          userId: user?.id
        })
      }
      
      // 부모 컴포넌트에 데이터 새로고침 알림
      console.log('🔄 부모 컴포넌트 새로고침 요청')
      onFavoriteToggle?.()
      
    } catch (error) {
      console.error('❌ 즐겨찾기 토글 에러:', error)
      // 실패 시 상태 롤백
      setFavoriteState(!newFavoriteState)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Link href={url} className="block h-full">
      <Card className="hover:shadow-lg transition-all duration-300 group h-full bg-gray-800 border-gray-700 hover:border-purple-500/50 hover:transform hover:scale-[1.02] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-purple-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <CardContent className="p-4 flex flex-col h-full">
          {/* 헤더 섹션 */}
          <div className="flex items-start justify-between mb-2">
            {/* 아이콘과 카테고리 정보 */}
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mr-2 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${color}20` }}
              >
                {/* Icon을 JSX 요소로 렌더링 */}
                <Icon
                  className="w-4 h-4 transition-all group-hover:text-white"
                  style={{ color }}
                />
              </div>
              <div>
                <div className="text-xs font-medium transition-colors" style={{ color }}>
                  {category}
                  {subCategory && ` / ${subCategory}`}
                </div>
              </div>
            </div>
            
            {/* 날짜 정보 */}
            {formattedDate && (
              <div className="text-xs text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formattedDate}
              </div>
            )}
          </div>
          
          {/* 제목 */}
          <h3 className="font-semibold text-sm text-white mb-2 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-300">
            {title}
          </h3>
          
          {/* 요약 */}
          <p className="text-xs text-gray-400 flex-grow overflow-hidden group-hover:text-gray-300 transition-colors">
            {summary.length > 150
              ? `${summary.substring(0, 150)}...`
              : summary}
          </p>
          
          {/* 푸터 */}
          <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
            {/* 태그 (있을 경우) */}
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map(tag => (
                <span 
                  key={tag} 
                  className="text-xs bg-gray-700 px-2 py-0.5 rounded-full group-hover:bg-gray-600 transition-colors"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full group-hover:bg-gray-600 transition-colors">
                  +{tags.length - 2}
                </span>
              )}
            </div>
            
            {/* 메타데이터 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center group-hover:text-gray-300 transition-colors">
                <MessageSquare className="w-3 h-3 mr-1" />
                {messageCount}
              </span>
              {/* 즐겨찾기 버튼 - 모든 대화에서 표시 */}
              {chatSession?.id && (
                <button
                  onClick={handleFavoriteToggle}
                  disabled={isUpdating}
                  className={`p-1 rounded-sm transition-all duration-200 hover:scale-125 hover:bg-slate-700/50 ${
                    !isAuthenticated ? 'cursor-pointer opacity-70 hover:opacity-100' : 'cursor-pointer'
                  } ${isUpdating ? 'animate-pulse' : ''}`}
                  title={
                    !isAuthenticated 
                      ? '즐겨찾기 기능은 로그인 후 이용할 수 있습니다' 
                      : (favoriteState ? '즐겨찾기 해제' : '즐겨찾기 추가')
                  }
                  style={{ zIndex: 10 }}
                >
                  <Star 
                    className={`w-4 h-4 transition-colors ${
                      !isAuthenticated
                        ? 'text-gray-500'
                        : favoriteState 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-gray-400 hover:text-amber-400'
                    }`} 
                  />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
