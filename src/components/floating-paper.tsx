"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Bot, Hash, BookmarkIcon, Check, Share2, PenLine } from "lucide-react"

export function FloatingPaper({ count = 5 }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 클라이언트 사이드 렌더링일 때만 실행
    setIsClient(true)
    
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 3개 플랫폼 스타일
  const platformStyles = [
    // ChatGPT 스타일
    { 
      type: "chatgpt",
      bg: "bg-gradient-to-br from-gray-800/90 to-gray-900/90", 
      icon: <Bot className="w-4 h-4 text-emerald-300" />,
      name: "ChatGPT",
      border: "border-emerald-500/30",
      accent: "bg-emerald-500/20",
      accentText: "text-emerald-300",
      shadow: "shadow-[0_4px_15px_rgba(52,211,153,0.15)]",
      badge: <Check className="w-3 h-3 mr-1" />,
      badgeText: "Verified",
      badgeChance: 0.7
    },
    // 사용자 메시지 스타일
    { 
      type: "user",
      bg: "bg-gradient-to-br from-gray-800/90 to-gray-900/90", 
      icon: <User className="w-4 h-4 text-white" />,
      name: "You",
      border: "border-purple-500/30",
      accent: "bg-purple-500/20",
      accentText: "text-purple-300",
      shadow: "shadow-[0_4px_15px_rgba(139,92,246,0.15)]",
      badge: null,
      badgeText: "",
      badgeChance: 0
    },
    // Obsidian 스타일
    { 
      type: "obsidian",
      bg: "bg-gradient-to-br from-purple-900/90 to-indigo-900/90", 
      icon: <Hash className="w-4 h-4 text-purple-300" />,
      name: "Obsidian",
      border: "border-purple-500/30",
      accent: "bg-purple-500/20",
      accentText: "text-purple-300",
      shadow: "shadow-[0_4px_15px_rgba(139,92,246,0.15)]",
      badge: <PenLine className="w-3 h-3 mr-1" />,
      badgeText: "Vault",
      badgeChance: 0.4
    }
  ];

  // 플랫폼별 액션 아이콘
  const platformActions = {
    chatgpt: [
      <Share2 key="share" className="w-3 h-3 text-gray-400" />,
      <BookmarkIcon key="bookmark" className="w-3 h-3 text-gray-400" />
    ],
    user: [],
    obsidian: [
      <Hash key="tag" className="w-3 h-3 text-gray-400" />,
      <BookmarkIcon key="save" className="w-3 h-3 text-gray-400" />
    ]
  };

  // 메시지 내용 유형
  const contentTypes = {
    // 일반 텍스트
    text: (style: typeof platformStyles[0]) => (
      <div className="p-3">
        <div className={`h-2 ${style.accent} rounded-full w-full mb-2`}></div>
        <div className={`h-2 ${style.accent} rounded-full w-3/4 mb-2`}></div>
        <div className={`h-2 ${style.accent} rounded-full w-5/6`}></div>
      </div>
    ),
    // 코드 블록
    code: (style: typeof platformStyles[0]) => (
      <div className="p-3">
        <div className="flex items-center mb-2">
          <div className={`h-2 ${style.accent} rounded-full w-1/3 mr-1`}></div>
          <div className={`h-2 ${style.accent} rounded-full w-1/4`}></div>
        </div>
        <div className={`p-2 rounded ${style.accent} mb-2`}>
          <div className={`h-2 bg-white/30 rounded-full w-full mb-2`}></div>
          <div className={`h-2 bg-white/30 rounded-full w-4/5 mb-2`}></div>
          <div className={`h-2 bg-white/30 rounded-full w-3/4`}></div>
        </div>
        <div className={`h-2 ${style.accent} rounded-full w-2/3`}></div>
      </div>
    ),
    // 목록 유형
    list: (style: typeof platformStyles[0]) => (
      <div className="p-3">
        <div className={`h-2 ${style.accent} rounded-full w-4/5 mb-3`}></div>
        <div className="flex items-center mb-2">
          <div className={`h-2 w-2 rounded-full ${style.accent} mr-2`}></div>
          <div className={`h-2 ${style.accent} rounded-full w-3/4`}></div>
        </div>
        <div className="flex items-center mb-2">
          <div className={`h-2 w-2 rounded-full ${style.accent} mr-2`}></div>
          <div className={`h-2 ${style.accent} rounded-full w-2/3`}></div>
        </div>
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full ${style.accent} mr-2`}></div>
          <div className={`h-2 ${style.accent} rounded-full w-4/5`}></div>
        </div>
      </div>
    ),
    // Obsidian 링크
    links: (style: typeof platformStyles[0]) => (
      <div className="p-3">
        <div className={`h-2 ${style.accent} rounded-full w-3/4 mb-3`}></div>
        <div className="mb-2 flex items-center">
          <div className={`inline-flex items-center justify-center px-2 py-1 ${style.accent} rounded-md mr-2`}>
            <div className={`h-2 bg-white/30 rounded-full w-10`}></div>
          </div>
          <div className={`h-2 ${style.accent} rounded-full w-1/2`}></div>
        </div>
        <div className="mb-2 flex items-center">
          <div className={`inline-flex items-center justify-center px-2 py-1 ${style.accent} rounded-md mr-2`}>
            <div className={`h-2 bg-white/30 rounded-full w-12`}></div>
          </div>
          <div className={`h-2 ${style.accent} rounded-full w-2/5`}></div>
        </div>
        <div className={`h-2 ${style.accent} rounded-full w-3/5 mt-2`}></div>
      </div>
    )
  };

  // 플랫폼별 컨텐츠 타입 매핑
  const platformContentTypes = {
    chatgpt: ["text", "code", "list"],
    user: ["text"],
    obsidian: ["text", "links", "list"]
  };

  // 클라이언트 사이드 렌더링이 아니면 빈 컴포넌트 반환
  if (!isClient) {
    return <div className="relative w-full h-full opacity-0"></div>;
  }

  // 클라이언트 사이드 렌더링일 때만 애니메이션 컴포넌트 표시
  return (
    <div className="relative w-full h-full">
      {Array.from({ length: count }).map((_, i) => {
        // 서버와 클라이언트 렌더링을 동일하게 유지하기 위해 
        // 시드 기반 랜덤값 사용 (여기서는 인덱스를 시드로 활용)
        const platformIndex = Math.abs((i * 1234) % platformStyles.length);
        const platform = platformStyles[platformIndex];
        
        // 컨텐츠 타입도 인덱스 기반으로 결정
        const availableContentTypes = platformContentTypes[platform.type as keyof typeof platformContentTypes];
        const contentTypeIndex = Math.abs((i * 4321) % availableContentTypes.length);
        const contentType = availableContentTypes[contentTypeIndex];
        
        // 고정된 계산 방식 사용
        const width = 140 + (i % 3) * 40; // 140px, 180px, 220px 중 하나로 결정
        const rotation = -5 + (i % 10); // -5도 ~ 4도
        const hasBadge = platform.badge && (i % 2 === 0); // 짝수 인덱스일 때만 배지 표시
        
        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: (dimensions.width * (i % 5)) / 5,
              y: (dimensions.height * (i % 4)) / 4,
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              x: [
                (dimensions.width * ((i % 5))) / 5, 
                (dimensions.width * ((i % 5 + 2) % 5)) / 5, 
                (dimensions.width * ((i % 5 + 4) % 5)) / 5
              ],
              y: [
                (dimensions.height * ((i % 4))) / 4,
                (dimensions.height * ((i % 4 + 1) % 4)) / 4,
                (dimensions.height * ((i % 4 + 2) % 4)) / 4,
              ],
              rotate: [rotation, rotation + 180, rotation + 360],
              opacity: [0.7, 0.9, 0.7],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 25 + (i % 15),
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {/* 메시지 디자인 */}
            <div 
              className={`relative rounded-xl overflow-hidden backdrop-blur-sm border ${platform.border} flex flex-col transform hover:scale-105 transition-all duration-300 ${platform.shadow} ${platform.bg}`} 
              style={{ 
                width: `${width}px`, 
                height: "auto", 
                minHeight: "60px",
              }}
            >
              {/* 메시지 헤더 */}
              <div className={`px-3 py-2 flex items-center justify-between border-b ${platform.border}`}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full ${platform.accent} mr-2`}>
                    {platform.icon}
                  </div>
                  <span className={`text-xs font-medium truncate ${platform.accentText}`}>
                    {platform.name}
                  </span>
                </div>
                {hasBadge && (
                  <div className={`flex items-center ${platform.accentText} text-xs`}>
                    {platform.badge}
                    <span className="text-[10px]">{platform.badgeText}</span>
                  </div>
                )}
              </div>

              {/* 메시지 내용 */}
              {contentTypes[contentType as keyof typeof contentTypes](platform)}

              {/* 메시지 푸터 (해당 플랫폼에 액션이 있는 경우만) */}
              {platformActions[platform.type as keyof typeof platformActions].length > 0 && (
                <div className={`px-3 py-2 flex justify-end border-t ${platform.border}`}>
                  <div className="flex space-x-2">
                    {platformActions[platform.type as keyof typeof platformActions]
                      .map((action, idx) => (
                        <div 
                          key={idx} 
                          className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
                        >
                          {action}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
