"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // 모바일 여부 확인 (640px 이하)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // 초기 확인
    checkMobile();
    
    // 리사이즈 이벤트에 반응
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // 페이지 번호 계산
  const getPageNumbers = () => {
    const showPages = isMobile ? 3 : 5; // 모바일에서는 3개, 데스크탑에서는 5개 표시
    
    const pageNumbers = [];
    if (totalPages <= showPages) {
      // 전체 페이지가 표시할 페이지 수보다 적으면 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= Math.ceil(showPages / 2)) {
      // 현재 페이지가 앞쪽에 있는 경우
      for (let i = 1; i <= showPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - Math.floor(showPages / 2)) {
      // 현재 페이지가 뒤쪽에 있는 경우
      for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 현재 페이지가 중간에 있는 경우
      const halfShow = Math.floor(showPages / 2);
      for (let i = currentPage - halfShow; i <= currentPage + halfShow; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();
  
  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  
  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
      {/* 처음으로 버튼 (데스크탑에서만 표시) */}
      <button
        onClick={goToFirstPage}
        disabled={currentPage === 1}
        className={`hidden sm:flex px-2 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ${
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className="sr-only">처음</span>
        <ChevronLeft className="h-4 w-4 mr-1" />
        <ChevronLeft className="h-4 w-4 -ml-2" />
      </button>
      
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`flex items-center px-2 sm:px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ${
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1">이전</span>
      </button>

      {/* 페이지 번호 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-sm transition-colors ${
            currentPage === page
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`flex items-center px-2 sm:px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ${
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">다음</span>
        <ChevronRight className="h-4 w-4" />
      </button>
      
      {/* 마지막으로 버튼 (데스크탑에서만 표시) */}
      <button
        onClick={goToLastPage}
        disabled={currentPage === totalPages}
        className={`hidden sm:flex px-2 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ${
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className="sr-only">마지막</span>
        <ChevronRight className="h-4 w-4 mr-1" />
        <ChevronRight className="h-4 w-4 -ml-2" />
      </button>
    </div>
  )
}
