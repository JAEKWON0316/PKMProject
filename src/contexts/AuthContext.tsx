'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange, getUserProfile, signOut } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

// 프로필 타입 정의
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAuthenticated: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null)

  // 사용자 프로필 가져오기
  const fetchUserProfile = async (userId: string) => {
    try {
      const profileData = await getUserProfile(userId)
      setProfile(profileData)
    } catch (error) {
      console.error('프로필 가져오기 오류:', error)
    }
  }

  // 세션 만료 체크 및 자동 로그아웃
  const checkSessionExpiry = async () => {
    try {
      const currentSession = await getSession()
      if (!currentSession) {
        // 세션이 없으면 자동 로그아웃
        await signOut()
        router.push('/')
      }
    } catch (error) {
      console.error('세션 체크 오류:', error)
    }
  }

  useEffect(() => {
    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        // getSession만 호출하여 세션과 사용자 정보를 동시에 가져오기
        const currentSession = await getSession()
        
        setUser(currentSession?.user ?? null)
        setSession(currentSession)

        // 사용자가 있으면 프로필도 가져오기
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id)
          
          // 10분마다 세션 상태 체크
          if (sessionCheckRef.current) {
            clearInterval(sessionCheckRef.current)
          }
          sessionCheckRef.current = setInterval(checkSessionExpiry, 10 * 60 * 1000)
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // 인증 상태 변화 리스너 설정
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        // 개발 환경에서만 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth state changed:', event, session)
        }
        
        // 즉시 상태 업데이트
        setSession(session)
        setUser(session?.user ?? null)
        
        // 로그인 시 프로필 가져오기
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id)
          
          // 세션 체크 타이머 시작
          if (sessionCheckRef.current) {
            clearInterval(sessionCheckRef.current)
          }
          sessionCheckRef.current = setInterval(checkSessionExpiry, 10 * 60 * 3000)
        }
        
        // 로그아웃 시 즉시 프로필 초기화
        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setLoading(false)
          
          // 타이머 정리
          if (sessionCheckRef.current) {
            clearInterval(sessionCheckRef.current)
            sessionCheckRef.current = null
          }
          
          // 로그아웃 이벤트 발생 시 즉시 상태 업데이트
          console.log('사용자 로그아웃 완료')
        }
        
        // 로딩 상태 업데이트
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false)
        }
        
        // 토큰 새로고침 시에도 상태 업데이트
        if (event === 'TOKEN_REFRESHED') {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
    }
  }, [router, pathname])

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user && !!session
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다')
  }
  return context
} 