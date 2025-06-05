'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
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
  
  // 프로필 캐시 (메모리)
  const profileCacheRef = useRef<{ [userId: string]: UserProfile | null }>({})
  // 자동 로그아웃 타이머 ref
  const autoLogoutRef = useRef<NodeJS.Timeout | null>(null)
  // 로그아웃 guard
  const isLoggingOutRef = useRef(false)

  // 자동 로그아웃 (access_token 만료 기준)
  const scheduleAutoLogout = useCallback((expiresAt?: number) => {
    if (autoLogoutRef.current) clearTimeout(autoLogoutRef.current)
    if (!expiresAt) return
    const ms = Math.max(0, expiresAt * 1000 - Date.now() - 5000) // 만료 5초 전
    autoLogoutRef.current = setTimeout(() => {
      handleLogout("세션이 만료되어 로그아웃되었습니다. 다시 로그인 해주세요.")
    }, ms)
  }, [])

  // 로그아웃 처리
  const handleLogout = useCallback(
    async (message?: string) => {
      if (isLoggingOutRef.current) return
      isLoggingOutRef.current = true
      await signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      if (autoLogoutRef.current) clearTimeout(autoLogoutRef.current)
      if (message) alert(message)
      router.push('/')
      setTimeout(() => {
        isLoggingOutRef.current = false
      }, 2000)
    },
    [router]
  )

  // 프로필 fetch (캐시 우선, 네트워크 후 최신값 갱신)
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      if (profileCacheRef.current[userId]) setProfile(profileCacheRef.current[userId])
      try {
        const profileData = await getUserProfile(userId)
        setProfile(profileData || null)
        profileCacheRef.current[userId] = profileData || null
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 403) {
          handleLogout("세션이 만료되어 로그아웃되었습니다. 다시 로그인 해주세요.")
        } else {
          setProfile(null)
        }
      }
    },
    [handleLogout]
  )

  // 세션/프로필 동기화 (최초 mount, 라우팅, 탭 복귀)
  const syncSessionAndProfile = useCallback(async () => {
    const currentSession = await getSession()
    setUser(currentSession?.user ?? null)
    setSession(currentSession ?? null)
    if (currentSession?.user) {
      fetchUserProfile(currentSession.user.id)
      scheduleAutoLogout(currentSession.expires_at)
    } else {
      setProfile(null)
      if (autoLogoutRef.current) clearTimeout(autoLogoutRef.current)
    }
    setLoading(false)
  }, [fetchUserProfile, scheduleAutoLogout])

  // 최초 mount, 라우팅, 탭 복귀 시 동기화
  useEffect(() => {
    syncSessionAndProfile()
  }, [pathname])
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncSessionAndProfile()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [syncSessionAndProfile])

  // onAuthStateChange로 로그인/로그아웃/토큰 갱신 감지
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        setSession(session)
        fetchUserProfile(session.user.id)
        scheduleAutoLogout(session.expires_at)
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
        setProfile(null)
        if (autoLogoutRef.current) clearTimeout(autoLogoutRef.current)
      }
    })
    return () => subscription.unsubscribe()
  }, [fetchUserProfile, scheduleAutoLogout])

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