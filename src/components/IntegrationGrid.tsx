import type { Integration } from "@/app/data/integrations"
import IntegrationCard from "./IntegrationCard"
import { ChatSession } from "@/types"
import { MessageSquare, Book, Code, Briefcase, Music, Heart, Home, Activity, Plane, DollarSign, Cpu, LucideIcon } from "lucide-react"
import { useState } from 'react';

// 카테고리별 아이콘 매핑
const categoryIcons: Record<string, React.ElementType> = {
  "개발": Code,
  "창작": Music,
  "학습": Book,
  "업무": Briefcase,
  "취미": Heart,
  "생활": Home,
  "건강": Activity,
  "여행": Plane,
  "경제": DollarSign,
  "기술": Cpu,
  "기타": MessageSquare
}

type IntegrationGridProps = {
  integrations: (Integration & { url?: string })[]
  chatSessions?: Partial<ChatSession>[]
  categoryCount?: number
  onFavoriteToggle?: () => void
  userMap?: Record<string, string>
}

export default function IntegrationGrid({ integrations, chatSessions = [], categoryCount, onFavoriteToggle, userMap }: IntegrationGridProps) {
  // 삭제 성공 시 부모의 onFavoriteToggle만 호출
  const handleDeleteSuccess = () => {
    onFavoriteToggle?.();
  };

  if (chatSessions.length > 0) {
    // 각 세션을 임시 Integration 객체로 변환
    const fakeIntegrations = chatSessions.map(session => {
      const mainCategory = session.metadata?.mainCategory || "기타";
      // 카테고리에 맞는 아이콘 선택, 없으면 기본 아이콘 사용
      const icon = categoryIcons[mainCategory] || MessageSquare;
      return {
        id: session.id || "",
        name: session.title || "제목 없음",
        description: session.summary || "요약 없음",
        category: mainCategory,
        icon: icon as unknown as React.ComponentType, // 타입 변환
        color: "#6366f1", // 기본 색상
        url: `/success?id=${session.id}`,
        chatSession: session
      };
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
        {fakeIntegrations.map((integration) => (
          <IntegrationCard 
            key={integration.id} 
            integration={integration} 
            categoryCount={categoryCount}
            onFavoriteToggle={onFavoriteToggle}
            onDeleteSuccess={handleDeleteSuccess}
            userMap={userMap}
          />
        ))}
      </div>
    );
  }
  
  // 기존 integrations 데이터 표시
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
      {integrations.map((integration) => (
        <IntegrationCard 
          key={integration.id} 
          integration={integration} 
          categoryCount={categoryCount}
          onFavoriteToggle={onFavoriteToggle}
          onDeleteSuccess={handleDeleteSuccess}
          userMap={userMap}
        />
      ))}
    </div>
  )
}
