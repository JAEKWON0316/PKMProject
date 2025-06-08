"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, User } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { LoginModal } from "./login-modal"
import { useAuth } from "@/contexts/AuthContext"
import { signOut } from "@/lib/auth"

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, profile, isAuthenticated, loading } = useAuth();

  // 메인페이지 여부 확인
  const isMainPage = pathname === '/';

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      setIsMobileMenuOpen(false);
      
      // 즉시 홈페이지로 리다이렉트 (로그인 화면 방지)
      router.push('/');
      
      // 그 다음에 로그아웃 실행 (백그라운드에서)
      const result = await signOut();
      
      if (!result.success) {
        console.error('로그아웃 실패:', result.message);
        // 실패한 경우에만 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 오류 발생 시에만 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // 표시할 사용자 이름 결정
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <>
      <nav className={`${isMainPage ? 'w-full' : 'fixed top-0 left-0 w-full'} z-50 py-3 px-4 sm:py-4 sm:px-6 md:px-8 ${isMainPage ? 'bg-black/[0.96]' : 'bg-gray-900/95'} backdrop-blur-sm`}>
        {/* 데스크탑 레이아웃 */}
        <div className="hidden md:block">
          <div className="container mx-auto flex justify-between items-center">
            {/* 좌측: 로고 */}
            <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform">
                <Image 
                  src="/pkmlogo006.png" 
                  alt="PKM AI Logo" 
                  width={32} 
                  height={32} 
                  className="h-6 w-6 sm:h-8 sm:w-8 relative z-10 object-contain"
                />
              </div>
              <span className="font-bold text-lg sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 group-hover:opacity-80 transition-opacity">
                PKM AI
              </span>
            </Link>

            {/* 데스크탑: 중앙 메뉴 */}
            <div className="flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <NavLink href="/save-chat" label="대화 저장" isActive={pathname === '/save-chat'} />
              <NavLink href="/rag" label="RAG 검색" isActive={pathname.startsWith('/rag')} />
              <NavLink href="/integrations" label="대화 찾아보기" isActive={pathname === '/integrations'} />
              <NavLink href="/pricing" label="가격" isActive={pathname === '/pricing'} />
              <NavLink href="/dashboard" label="대시보드" isActive={pathname === '/dashboard'} />
              {/* 관리자 전용 메뉴 */}
              {!loading && profile?.role === 'admin' && (
                <NavLink href="/admin" label="관리자" isActive={pathname === '/admin'} />
              )}
            </div>

            {/* 데스크탑: 우측 버튼들 */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {!loading && (
                <>
                  {isAuthenticated ? (
                    // 로그인된 상태
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                          {getDisplayName()}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-300 hover:text-white text-base"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        로그아웃
                      </Button>
                    </div>
                  ) : (
                    // 로그인되지 않은 상태
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-300 hover:text-white text-base"
                        onClick={() => setIsLoginModalOpen(true)}
                      >
                        로그인
                      </Button>
                      <Button 
                        size="sm" 
                        className="ripple-button text-white text-base"
                        onClick={() => setIsLoginModalOpen(true)}
                      >
                        <span className="font-medium relative z-10">
                          Get Started
                        </span>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 레이아웃 */}
        <div className="md:hidden flex justify-between items-center w-full px-1">
          {/* 좌측: 로고 */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-10 h-10 group-hover:scale-105 transition-transform">
              <Image 
                src="/pkmlogo006.png" 
                alt="PKM AI Logo" 
                width={32} 
                height={32} 
                className="h-8 w-8 relative z-10 object-contain"
              />
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 group-hover:opacity-80 transition-opacity">
              PKM AI
            </span>
          </Link>

          {/* 모바일: 우측 버튼들 */}
          <div className="flex items-center space-x-2">
            {!loading && !isAuthenticated && (
              <Button 
                size="sm" 
                className="ripple-button text-white text-sm px-3 py-2 opacity-90 hover:opacity-100 transition-opacity duration-300 shadow-lg relative z-10"
                onClick={() => setIsLoginModalOpen(true)}
              >
                <span className="font-medium relative z-10">
                  무료로 시작하기
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* 모바일 메뉴 드롭다운 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[64px] left-0 w-full z-40 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <MobileNavLink 
              href="/save-chat" 
              label="대화 저장" 
              isActive={pathname === '/save-chat'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileNavLink 
              href="/rag" 
              label="RAG 검색" 
              isActive={pathname.startsWith('/rag')}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileNavLink 
              href="/integrations" 
              label="대화 찾아보기" 
              isActive={pathname === '/integrations'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileNavLink 
              href="/pricing" 
              label="가격" 
              isActive={pathname === '/pricing'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileNavLink 
              href="/dashboard" 
              label="대시보드" 
              isActive={pathname === '/dashboard'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* 관리자 전용 메뉴 */}
            {!loading && profile?.role === 'admin' && (
              <MobileNavLink 
                href="/admin" 
                label="관리자" 
                isActive={pathname === '/admin'}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
            {!loading && (
              <div className="pt-2 border-t border-gray-800">
                {isAuthenticated ? (
                  // 모바일: 로그인된 상태
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 py-2 px-3 text-gray-300">
                      <User className="h-4 w-4" />
                      <span className="text-sm">
                        {getDisplayName()}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-gray-300 hover:text-white justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </Button>
                  </div>
                ) : (
                  // 모바일: 로그인되지 않은 상태
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-gray-300 hover:text-white justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                  >
                    로그인
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
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

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

function MobileNavLink({ href, label, isActive, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-2 px-3 rounded-md text-base transition-colors ${
        isActive
          ? "text-white bg-purple-600/20 font-medium"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {label}
    </Link>
  );
}

