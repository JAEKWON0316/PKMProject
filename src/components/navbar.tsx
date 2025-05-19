"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-xl">
          PKM Project
        </Link>

        <div className="flex space-x-6">
          <NavLink href="/" label="홈" isActive={pathname === '/'} />
          <NavLink href="/save-chat" label="대화 저장" isActive={pathname === '/save-chat'} />
          <NavLink href="/rag" label="RAG 검색" isActive={pathname.startsWith('/rag')} />
          <NavLink href="/success" label="저장된 대화" isActive={pathname === '/success'} />
        </div>
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
      className={`text-sm transition-colors ${
        isActive
          ? "text-white font-medium border-b-2 border-purple-500"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
