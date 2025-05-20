"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "")
  const [isPending, startTransition] = useTransition()
  
  // URL 쿼리 파라미터가 변경될 때 검색어 상태 업데이트
  useEffect(() => {
    setSearchTerm(searchParams.get("query") || "")
  }, [searchParams])
  
  // 검색 핸들러
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    
    startTransition(() => {
      // 현재 URL 파라미터 복제
      const params = new URLSearchParams(searchParams.toString())
      
      if (term) {
        params.set("query", term)
      } else {
        params.delete("query")
      }
      
      // 페이지는 1로 초기화
      params.delete("page")
      
      // 새로운 URL로 이동
      router.push(`/integrations?${params.toString()}`)
    })
  }

  return (
    <div className="relative mb-4 max-w-md mx-auto">
      <Input
        type="text"
        placeholder="대화 검색..."
        className="w-full h-10 pl-10 pr-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        disabled={isPending}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    </div>
  )
}
