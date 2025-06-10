import { Suspense } from "react"
import IntegrationsClient from "./IntegrationsClient"

function PKMLoading() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">PKM AI</p>
          <p className="text-sm text-gray-400 mt-2">로딩 중...</p>
        </div>
      </div>
    </div>
  )
}

// 정적 렌더링을 하지 않도록 설정 (빌드 시 사전 렌더링 방지)
export const dynamic = 'force-dynamic'

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<PKMLoading />}>
      <IntegrationsClient />
    </Suspense>
  )
}
