import { Suspense } from "react"
import IntegrationsClient from "./IntegrationsClient"

// 정적 렌더링을 하지 않도록 설정 (빌드 시 사전 렌더링 방지)
export const dynamic = 'force-dynamic'

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>}>
      <IntegrationsClient />
    </Suspense>
  )
}
