"use client"

import { useState, useMemo } from "react"
import { categories, integrations, type Integration } from "@/app/data/integrations"
import SearchBar from "@/components/SearchBar"
import IntegrationGrid from "@/components/IntegrationGrid"
import Pagination from "@/components/Pagination"

const ITEMS_PER_PAGE = 30

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration: Integration) => {
      const categoryMatch = selectedCategory === "All" || integration.category === selectedCategory
      const searchMatch =
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      return categoryMatch && searchMatch
    })
  }, [selectedCategory, searchQuery])

  const totalPages = Math.ceil(filteredIntegrations.length / ITEMS_PER_PAGE)
  const paginatedIntegrations = filteredIntegrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* 왼쪽 사이드바 - 카테고리 필터 */}
      <div className="w-64 hidden md:block bg-gray-800 border-r border-gray-700 overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">카테고리</h2>
          <div className="space-y-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setCurrentPage(1)
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">대화 찾아보기</h1>
          <SearchBar
            onSearch={(query: string) => {
              setSearchQuery(query)
              setCurrentPage(1)
            }}
          />
        </div>

        {/* 모바일 전용 카테고리 필터 */}
        <div className="md:hidden p-4 border-b border-gray-700 overflow-x-auto">
          <div className="flex space-x-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 대화 목록 영역 */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">{selectedCategory}</span>
              <span className="text-sm text-gray-400 ml-2">
                ({filteredIntegrations.length}개 대화)
              </span>
            </div>
          </div>

          {filteredIntegrations.length > 0 ? (
            <IntegrationGrid integrations={paginatedIntegrations} />
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-xl">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 하단 페이지네이션 */}
        <div className="p-4 border-t border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}
