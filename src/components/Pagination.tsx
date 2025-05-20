"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

type PaginationProps = {
  currentPage: number
  totalPages: number
  currentCategory?: string
  searchQuery?: string
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  currentCategory = "All", 
  searchQuery = "" 
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL 파라미터를 포함한 페이지 URL 생성
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (page > 1) {
      params.set("page", page.toString())
    } else {
      params.delete("page")
    }
    
    return `/integrations?${params.toString()}`
  }
  
  // 페이지 번호 계산
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (currentPage <= 3) return i + 1
    if (currentPage >= totalPages - 2) return totalPages - 4 + i
    return currentPage - 2 + i
  })

  return (
    <div className="flex items-center justify-center space-x-2">
      <Link
        href={getPageUrl(Math.max(1, currentPage - 1))}
        className={`px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 ${
          currentPage === 1 ? "pointer-events-none opacity-50" : ""
        }`}
      >
        이전
      </Link>

      {pageNumbers.map((page) => (
        <Link
          key={page}
          href={getPageUrl(page)}
          className={`w-10 h-10 rounded-md flex items-center justify-center ${
            currentPage === page
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {page}
        </Link>
      ))}

      <Link
        href={getPageUrl(Math.min(totalPages, currentPage + 1))}
        className={`px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 ${
          currentPage === totalPages ? "pointer-events-none opacity-50" : ""
        }`}
      >
        다음
      </Link>
    </div>
  )
}
