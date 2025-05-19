"use client"

import Link from "next/link"

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-float">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          PKM Project
        </span>
      </h1>
      <p className="text-lg md:text-xl text-gray-300 max-w-3xl mb-10">
        ChatGPT 공유 기능 기반 지식 관리 시스템
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <Link href="/save-chat" className="group">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                대화 저장
              </h3>
              <p className="text-gray-400">
                ChatGPT 공유 링크를 통해 대화 내용을 저장하고 관리합니다.
              </p>
            </div>
          </div>
        </Link>
        
        <Link href="/rag" className="group">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                벡터 검색 (RAG)
              </h3>
              <p className="text-gray-400">
                저장된 대화 데이터를 바탕으로 벡터 검색 기능을 활용합니다.
              </p>
            </div>
          </div>
        </Link>
        
        <Link href="/success" className="group">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                저장된 대화
              </h3>
              <p className="text-gray-400">
                이전에 저장한 대화 내용을 확인하고 관리합니다.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
