'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange, getUserProfile } from '@/lib/auth'
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

  // 사용자 프로필 가져오기
  const fetchUserProfile = async (userId: string) => {
    try {
      const profileData = await getUserProfile(userId)
      setProfile(profileData)
    } catch (error) {
      console.error('프로필 가져오기 오류:', error)
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
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // 로그인 시 프로필 가져오기
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id)
        }
        
        // 로그아웃 시 프로필 초기화
        if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
        
        // 로딩 상태 업데이트
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
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