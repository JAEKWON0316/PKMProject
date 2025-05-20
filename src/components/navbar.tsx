"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full py-6 px-6 sm:px-8">
      <div className="container mx-auto flex justify-between items-center">
        {/* 좌측: 로고 */}
        <Link href="/" className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          PKM AI
        </Link>

        {/* 중앙: 메인 메뉴 - 모바일에서는 숨김 */}
        <div className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
          <NavLink href="/save-chat" label="대화 저장" isActive={pathname === '/save-chat'} />
          <NavLink href="/rag" label="RAG 검색" isActive={pathname.startsWith('/rag')} />
          <NavLink href="/integrations" label="대화 찾아보기" isActive={pathname === '/integrations'} />
          <NavLink href="/" label="대시보드" isActive={false} />
        </div>

        {/* 우측: 인증 버튼 */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white text-base">
            로그인
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-base">
            Get Started
          </Button>
        </div>

        {/* 모바일용 메뉴 아이콘 - 필요시 구현 */}
        <div className="md:hidden">
          {/* 모바일 메뉴는 추후 구현 가능성 고려 */}
        </div>
      </div>

      {/* 모바일 전용 메뉴 (하단에 표시) */}
      <div className="md:hidden flex justify-center space-x-4 mt-2 pb-1">
        <NavLink href="/save-chat" label="대화 저장" isActive={pathname === '/save-chat'} />
        <NavLink href="/rag" label="RAG 검색" isActive={pathname.startsWith('/rag')} />
        <NavLink href="/integrations" label="대화 찾아보기" isActive={pathname === '/integrations'} />
        <NavLink href="/" label="대시보드" isActive={false} />
      </div>
    </nav>
  )
}

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

function NavLink({ href, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`text-base transition-colors ${
        isActive
         ? "text-white font-medium"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
