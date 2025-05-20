import type { Integration } from "@/app/data/integrations"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Clock, Star, LucideIcon } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { ChatSession } from "@/types"

type IntegrationCardProps = {
  integration: Integration & { url?: string; chatSession?: Partial<ChatSession> }
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

export default function IntegrationCard({ integration }: IntegrationCardProps) {
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
  const isFavorite = chatSession?.metadata?.favorite || false
  const messageCount = chatSession?.metadata?.messageCount || "?"
  
  // URL 구성
  const url = chatSession ? `/success?id=${chatSession.id}` : (integration.url || '#')
  
  // 색상 설정
  const color = categoryColors[category] || integration.color || "#64748b"
  
  // 시간 포맷팅
  const formattedDate = created_at 
    ? formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ko }) 
    : null

  return (
    <Link href={url} className="block">
      <Card className="hover:shadow-lg transition-all duration-300 group h-full bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-purple-600/40">
        <CardContent className="p-4 flex flex-col h-full">
          {/* 헤더 섹션 */}
          <div className="flex items-start justify-between mb-2">
            {/* 아이콘과 카테고리 정보 */}
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                style={{ backgroundColor: `${color}20` }}
              >
                {/* Icon을 JSX 요소로 렌더링 */}
                <Icon
                  className="w-4 h-4"
                  style={{ color }}
                />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color }}>
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
          <h3 className="font-semibold text-sm text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            {title}
          </h3>
          
          {/* 요약 */}
          <p className="text-xs text-gray-400 flex-grow overflow-hidden">
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
                  className="text-xs bg-gray-700 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {/* 메타데이터 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {messageCount}
              </span>
              {isFavorite && (
                <Star className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
