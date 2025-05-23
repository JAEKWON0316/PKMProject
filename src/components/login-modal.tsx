"use client"

import { useEffect, useState } from "react"
import { X, ArrowLeft } from "lucide-react"
import { LoginCard } from "./login-card"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [resetToEmailMode, setResetToEmailMode] = useState(false)
  const [isPasswordMode, setIsPasswordMode] = useState(false)

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

  // 뒤로가기 버튼 클릭 핸들러
  const handleBackClick = () => {
    setResetToEmailMode(true)
    // 리셋 후 상태 초기화
    setTimeout(() => setResetToEmailMode(false), 100)
  }

  // 비밀번호 모드 변경 핸들러
  const handlePasswordModeChange = (usePassword: boolean) => {
    setIsPasswordMode(usePassword)
  }

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
        {/* 로그인 카드 */}
        <div className="scale-80 sm:scale-100 origin-center">
          <LoginCard 
            resetToEmailMode={resetToEmailMode} 
            onPasswordModeChange={handlePasswordModeChange}
            onClose={onClose}
            onBack={handleBackClick}
            showBackButton={isPasswordMode}
          />
        </div>
      </div>
    </div>
  )
} 