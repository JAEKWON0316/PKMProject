import type { Integration } from "@/app/data/integrations"
import IntegrationCard from "./IntegrationCard"
import { ChatSession } from "@/types"
import { MessageSquare, LucideIcon } from "lucide-react"

type IntegrationGridProps = {
  integrations: (Integration & { url?: string })[]
  chatSessions?: Partial<ChatSession>[]
}

export default function IntegrationGrid({ integrations, chatSessions = [] }: IntegrationGridProps) {
  // 채팅 세션이 제공된 경우 이를 먼저 표시
  if (chatSessions.length > 0) {
    // 각 세션을 임시 Integration 객체로 변환
    const fakeIntegrations = chatSessions.map(session => {
      const mainCategory = session.metadata?.mainCategory || "기타";
      return {
        id: session.id || "",
        name: session.title || "제목 없음",
        description: session.summary || "요약 없음",
        category: mainCategory,
        icon: MessageSquare as unknown as React.ComponentType, // 타입 변환
        color: "#6366f1", // 기본 색상
        url: `/success?id=${session.id}`,
        chatSession: session
      };
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {fakeIntegrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    );
  }
  
  // 기존 integrations 데이터 표시
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {integrations.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}
    </div>
  )
}
