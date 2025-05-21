"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileText, Sparkles, ArrowRight } from "lucide-react"
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
    <div className="relative min-h-[calc(100vh-76px)] flex items-center">
      {/* Sparkles background */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 50 : 100} // 모바일에서는 파티클 수 감소
          className="h-full w-full"
          particleColor="rgba(138, 43, 226, 0.3)"
        />
      </div>

      {/* Floating papers background - 모바일에서는 수를 줄임 */}
      <div className="absolute inset-0 overflow-hidden z-1">
        <FloatingPaper count={isMobile ? 3 : 6} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                PKM Project
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

          {/* PC 화면에서만 카드 표시 */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-5xl w-full mx-auto"
            >
              <Link href="/save-chat" className="group">
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50">
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
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50">
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
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50">
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
          )}

          {/* 모바일 화면에서만 표시하는 간소화된 버튼들 */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col gap-3 mx-auto max-w-xs"
            >
              <Link href="/save-chat" className="group w-full">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-medium py-5 flex items-center justify-between"
                  size="lg"
                >
                  <span>대화 저장</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link href="/rag" className="group w-full">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-5 flex items-center justify-between"
                  size="lg"
                >
                  <span>벡터 검색 (RAG)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link href="/integrations" className="group w-full">
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-medium py-5 flex items-center justify-between"
                  size="lg"
                >
                  <span>대화 찾아보기</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Animated robot - 모바일에서는 작게 표시 */}
      <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96">
        <RoboAnimation />
      </div>
    </div>
  )
}
