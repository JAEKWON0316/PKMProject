"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { LoginCard } from "./login-card"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      // 스크롤 방지
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative z-10 mx-1 sm:mx-4 w-full max-w-xs sm:max-w-md">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 z-20 rounded-full bg-gray-800 p-1.5 sm:p-2 text-white hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        {/* 로그인 카드 */}
        <div className="scale-80 sm:scale-100 origin-center">
          <LoginCard />
        </div>
      </div>
    </div>
  )
} 