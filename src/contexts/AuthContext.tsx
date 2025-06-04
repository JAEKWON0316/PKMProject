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
  
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null)
  const autoLogoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // user와 session이 최초로 세팅될 때만 타이머 최초 설정
  const prevUserRef = useRef<User | null>(null)
  const prevSessionRef = useRef<Session | null>(null)

  // 자동 로그아웃 함수
  const handleAutoLogout = useCallback(async () => {
    console.log('🛑 [자동로그아웃] handleAutoLogout 실행 (타이머 만료)')
    if (autoLogoutRef.current) {
      clearTimeout(autoLogoutRef.current)
      autoLogoutRef.current = null
      console.log('🧹 [자동로그아웃] 로그아웃 시 타이머 완전 정리')
    }
    try {
      await signOut()
      alert('세션이 만료되어 로그아웃되었습니다.')
      router.push('/')
    } catch (error) {
      console.error('자동 로그아웃 오류:', error)
    }
  }, [router])

  // 토큰 갱신 함수
  const refreshToken = useCallback(async () => {
    try {
      const currentSession = await getSession()
      if (currentSession) {
        console.log('🔄 토큰 갱신 완료')
        setSession(currentSession)
        setUser(currentSession.user)
      }
    } catch (error) {
      console.error('토큰 갱신 오류:', error)
    }
  }, [])

  // 사용자 활동 감지 및 타이머 리셋
  const resetActivityTimer = useCallback(() => {
    if (!user || !session) {
      // user/session이 없으면 타이머 재설정 시도 자체를 하지 않음
      return;
    }
    lastActivityRef.current = Date.now()

    if (autoLogoutRef.current) {
      clearTimeout(autoLogoutRef.current)
      console.log('🔄 [자동로그아웃] 기존 타이머 clear')
    }

    console.log('👆 [자동로그아웃] 타이머 리셋 및 재설정 (user, session 있음)', { user, session })
    autoLogoutRef.current = setTimeout(() => {
      console.log('🛑 [자동로그아웃] 타이머 만료 - handleAutoLogout 실행')
      handleAutoLogout()
    }, 55 * 60 * 1000)
    console.log('⏰ [자동로그아웃] 새로운 타이머 설정 (55분 후 만료)')
  }, [user, session, handleAutoLogout])

  // 사용자 활동 이벤트 리스너 설정 (최초 1회만 등록)
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    let throttleTimer: NodeJS.Timeout | null = null

    const handleActivity = () => {
      console.trace('사용자 활동 감지')
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        resetActivityTimer()
        throttleTimer = null
      }, 30 * 1000)
    }

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
    }
  }, [])

  // user와 session이 최초로 세팅될 때만 타이머 최초 설정
  useEffect(() => {
    // 이전에 user/session이 없었고, 지금은 값이 생겼을 때만 실행
    if (!prevUserRef.current && !prevSessionRef.current && user && session) {
      console.log('🚩 [자동로그아웃] 최초 로그인 - 타이머 최초 설정')
      resetActivityTimer()
    }
    prevUserRef.current = user
    prevSessionRef.current = session
  }, [user, session, resetActivityTimer])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoLogoutRef.current) {
        clearTimeout(autoLogoutRef.current)
      }
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
    }
  }, [])

  // 사용자 프로필 가져오기
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('👤 사용자 프로필 로드 시작:', userId)
      const profileData = await getUserProfile(userId)
      
      if (profileData) {
        console.log('✅ 프로필 로드 성공:', profileData.full_name || profileData.email)
        setProfile(profileData)
      } else {
        console.log('⚠️ 프로필 데이터가 없음')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ 프로필 가져오기 오류:', error)
      setProfile(null)
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
          
          // 자동 로그아웃 타이머 시작
          resetActivityTimer()
        } else {
          // 세션이 없을 때 임시 인증 상태 확인
          const tempUser = localStorage.getItem('temp_auth_user')
          const tempVerified = localStorage.getItem('temp_auth_verified')
          
          if (tempUser && tempVerified === 'true') {
            try {
              const userData = JSON.parse(tempUser)
              console.log('✅ 임시 인증 상태 복원:', userData.email)
              setUser(userData)
              
              // 임시 세션 객체 생성
              const tempSession = {
                access_token: 'temp_token',
                refresh_token: 'temp_refresh',
                expires_in: 3600,
                expires_at: Date.now() + 3600000,
                token_type: 'bearer',
                user: userData
              }
              setSession(tempSession as any)
              
              // 임시 프로필 설정
              const tempProfile = {
                id: userData.id,
                email: userData.email,
                full_name: userData.user_metadata?.full_name || null,
                avatar_url: null,
                created_at: userData.created_at || new Date().toISOString(),
                updated_at: userData.updated_at || new Date().toISOString()
              }
              setProfile(tempProfile)
              
              // 임시 인증도 자동 로그아웃 타이머 시작
              resetActivityTimer()
              
              // 임시 인증 데이터 정리
              localStorage.removeItem('temp_auth_user')
              localStorage.removeItem('temp_auth_verified')
            } catch (error) {
              console.error('임시 인증 상태 복원 실패:', error)
              localStorage.removeItem('temp_auth_user')
              localStorage.removeItem('temp_auth_verified')
            }
          }
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
        
        // session이 null이 아닐 때만 상태 업데이트
        if (session) {
          setSession(session)
          setUser(session.user)
        }
        
        // 로그인 시 프로필 가져오기
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await fetchUserProfile(session.user.id)
            
            // 자동 로그아웃 타이머 시작
            resetActivityTimer()
            
            // 프로필 로드 완료 후 loading false
            setLoading(false)
          } catch (error) {
            console.error('프로필 로드 실패:', error)
            // 프로필 로드 실패해도 로그인은 성공으로 처리
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setUser(null)
          setSession(null)
          setLoading(false)
          
          // 자동 로그아웃 타이머 정리
          if (autoLogoutRef.current) {
            clearTimeout(autoLogoutRef.current)
            autoLogoutRef.current = null
          }
          
          // 로그아웃 이벤트 발생 시 즉시 상태 업데이트
          console.log('사용자 로그아웃 완료')
        } else if (event === 'TOKEN_REFRESHED') {
          setLoading(false)
          // 자동 토큰 갱신 시에는 타이머를 리셋하지 않음 (사용자 활동과 구분)
          console.log('🔄 Supabase 자동 토큰 갱신 (타이머 유지)')
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