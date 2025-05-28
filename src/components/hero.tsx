"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileText, Sparkles, ArrowRight, ArrowUpRight } from "lucide-react"
import { FloatingPaper } from "@/components/floating-paper"
import { RoboAnimation } from "@/components/robo-animation"
import { SparklesCore } from "@/components/sparkles"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Hero() {
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
    <div className="relative min-h-screen flex items-center">
      {/* Sparkles background */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 30 : 100} // 모바일에서는 파티클 수 더 감소
          className="h-full w-full"
          particleColor="rgba(138, 43, 226, 0.3)"
        />
      </div>

      {/* Floating papers background - 모바일에서는 더 줄임 */}
      <div className="absolute inset-0 overflow-hidden z-1">
        <FloatingPaper count={isMobile ? 2 : 6} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* 데스크탑 레이아웃 */}
        {!isMobile && (
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                지식 관리를 위한<br></br>
                스마트 AI 어시스턴트
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-10"
            >
              ChatGPT 공유 기능 기반 지식 관리 시스템
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-5xl w-full mx-auto"
            >
              <Link href="/save-chat" className="group">
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50 hover:bg-gray-900/40">
                  <div className="p-3 sm:p-4 md:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors">
                      대화 저장
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      ChatGPT 공유 링크를 통해 대화 내용을 저장하고 관리합니다.
                    </p>
                  </div>
                </div>
              </Link>
              
              <Link href="/rag" className="group">
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50 hover:bg-gray-900/40">
                  <div className="p-3 sm:p-4 md:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors">
                      벡터 검색 (RAG)
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      저장된 대화 데이터를 바탕으로 벡터 검색 기능을 활용합니다.
                    </p>
                  </div>
                </div>
              </Link>
              
              <Link href="/integrations" className="group">
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50 hover:bg-gray-900/40">
                  <div className="p-3 sm:p-4 md:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2 group-hover:text-green-400 transition-colors">
                      대화 찾아보기
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      저장된 전체 대화 내용을 확인하고 관리합니다.
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        )}

        {/* 모바일 레이아웃 - Meshy.ai 스타일 */}
        {isMobile && (
          <div className="max-w-md mx-auto text-center px-6">
            {/* 메인 타이틀 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                  지식 관리를 위한<br />스마트 AI 어시스턴트
                </span>
              </h1>
              <p className="text-gray-300 text-md leading-relaxed">
                PKM은 ChatGPT 대화를 체계적으로 저장하고 관리하여, 개발자, 연구자, 학습자들이 축적된 지식을 효과적으로 활용할 수 있도록 돕는 AI 기반 지식 관리 파트너입니다.
              </p>
            </motion.div>

            {/* 주요 CTA 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <Link href="/save-chat">
                <Button 
                  className="w-full ripple-button text-white font-semibold py-4 text-lg rounded-lg shadow-lg transition-opacity duration-300 opacity-90 hover:opacity-100 relative z-10"
                  size="lg"
                >
                  <span className="font-semibold relative z-10">
                    무료로 시작하세요
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* 하단 링크 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              <Link 
                href="/integrations" 
                className="flex items-center justify-center text-gray-300 hover:text-white transition-colors group"
              >
                <span className="text-base">기존 대화 탐색</span>
                <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        )}
      </div>

      {/* Animated robot - 모바일에서는 더 작게 표시 또는 숨김 */}
      {!isMobile && (
        <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96">
          <RoboAnimation />
        </div>
      )}

      {/* 모바일용 로봇 애니메이션 - 작은 크기 */}
      {isMobile && (
        <div className="absolute bottom-4 right-4 w-24 h-24 opacity-60">
          <RoboAnimation />
        </div>
      )}
    </div>
  )
}
