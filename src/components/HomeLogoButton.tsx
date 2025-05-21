"use client"

import Link from "next/link"
import { Hexagon } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomeLogoButton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 여부 확인 (768px 이하)
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 초기 확인
    checkMobile();
    
    // 리사이즈 이벤트에 반응
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <div className="fixed top-2 sm:top-4 left-2 sm:left-4 z-[100]">
      <Link href="/" className="flex items-center space-x-1 sm:space-x-2 cursor-pointer group">
        <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform">
          <div className="absolute inset-0 bg-purple-600/50 blur-md rounded-full animate-pulse"></div>
          <div className="absolute inset-1 bg-purple-500/40 blur-sm rounded-full"></div>
          <Hexagon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 relative z-10" />
        </div>
        <span className="font-bold text-lg sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 group-hover:opacity-80 transition-opacity">
          {isMobile ? "PKM AI" : "PKM AI"}
        </span>
      </Link>
    </div>
  )
} 