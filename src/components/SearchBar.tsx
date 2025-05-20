"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useSearchParams } from "next/navigation"

export type SearchMode = "title" | "summary" | "both";

interface SearchBarProps {
  onSearch: (term: string, mode: SearchMode) => void;
  initialValue?: string;
  initialMode?: SearchMode;
}

export default function SearchBar({ 
  onSearch, 
  initialValue = "", 
  initialMode = "title" 
}: SearchBarProps) {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialValue || searchParams.get("query") || "")
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode)
  
  // URL 쿼리 파라미터가 변경될 때 검색어 상태 업데이트
  useEffect(() => {
    const query = searchParams.get("query") || ""
    setSearchTerm(query)
  }, [searchParams])
  
  // 검색어 변경 핸들러
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    onSearch(term, searchMode)
  }
  
  // 검색 모드 변경 핸들러
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode)
    onSearch(searchTerm, mode)
  }

  return (
    <div className="mb-4 max-w-md mx-auto">
      <div className="relative">
        <Input
          type="text"
          placeholder={`${searchMode === "title" ? "제목" : searchMode === "summary" ? "요약" : "제목+요약"}으로 검색...`}
          className="w-full h-10 pl-10 pr-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
      </div>
      
      <div className="mt-2 flex justify-center space-x-4 text-sm">
        <label className={`flex items-center space-x-1 cursor-pointer ${searchMode === "title" ? "text-purple-400" : "text-gray-400"}`}>
          <input 
            type="radio" 
            className="hidden" 
            checked={searchMode === "title"} 
            onChange={() => handleModeChange("title")}
          />
          <span className={`w-3 h-3 rounded-full inline-block ${searchMode === "title" ? "bg-purple-500" : "bg-gray-600"}`}></span>
          <span>제목 검색</span>
        </label>
        
        <label className={`flex items-center space-x-1 cursor-pointer ${searchMode === "summary" ? "text-purple-400" : "text-gray-400"}`}>
          <input 
            type="radio" 
            className="hidden" 
            checked={searchMode === "summary"} 
            onChange={() => handleModeChange("summary")}
          />
          <span className={`w-3 h-3 rounded-full inline-block ${searchMode === "summary" ? "bg-purple-500" : "bg-gray-600"}`}></span>
          <span>요약 검색</span>
        </label>
        
        <label className={`flex items-center space-x-1 cursor-pointer ${searchMode === "both" ? "text-purple-400" : "text-gray-400"}`}>
          <input 
            type="radio" 
            className="hidden" 
            checked={searchMode === "both"} 
            onChange={() => handleModeChange("both")}
          />
          <span className={`w-3 h-3 rounded-full inline-block ${searchMode === "both" ? "bg-purple-500" : "bg-gray-600"}`}></span>
          <span>전체 검색</span>
        </label>
      </div>
    </div>
  )
}
