'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()

  // AuthContext에서 로그인 성공 감지하면 자동 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('🏠 AuthContext에서 로그인 확인됨, 홈으로 이동')
      router.replace('/')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient()
        
        console.log('🔗 Auth callback 처리 시작')
        console.log('📍 현재 URL:', window.location.href)
        
        // URL 파라미터에서 에러 확인
        const urlError = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (urlError) {
          console.error('❌ Auth error:', urlError, errorDescription)
          const errorParams = new URLSearchParams()
          errorParams.set('error', urlError)
          if (errorDescription) errorParams.set('error_description', errorDescription)
          router.replace(`/auth/error?${errorParams.toString()}`)
          return
        }

        // 토큰 처리
        console.log('🔐 토큰 처리 시작')
        
        // URL에 토큰이 있으면 Supabase가 자동으로 처리하도록 대기
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

        if (accessToken && refreshToken) {
          console.log('🔑 URL에서 토큰 발견, 세션 설정 중...')
          
          // 명시적으로 세션 설정
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).then(({ data, error }) => {
            if (error) {
              console.error('❌ 세션 설정 오류:', error)
              const errorParams = new URLSearchParams()
              errorParams.set('error', 'session_error')
              errorParams.set('error_description', '세션 설정에 실패했습니다.')
              router.replace(`/auth/error?${errorParams.toString()}`)
            } else {
              console.log('✅ 세션 설정 성공:', data.user?.email)
              // AuthContext가 SIGNED_IN 이벤트를 감지하면 자동으로 홈으로 리다이렉트
            }
          }).catch((err) => {
            console.error('❌ 세션 설정 예외:', err)
            const errorParams = new URLSearchParams()
            errorParams.set('error', 'session_exception')
            errorParams.set('error_description', '세션 설정 중 예외가 발생했습니다.')
            router.replace(`/auth/error?${errorParams.toString()}`)
          })
          
          return
        }

        // 토큰이 없는 경우 기존 세션 확인
        const { data: existingSession } = await supabase.auth.getSession()
        if (existingSession?.session) {
          console.log('✅ 기존 세션 확인 완료, 홈으로 이동')
          router.replace('/')
          return
        }

        // 세션이 없으면 에러 페이지로
        console.log('❌ 세션을 찾을 수 없음')
        const errorParams = new URLSearchParams()
        errorParams.set('error', 'no_session')
        errorParams.set('error_description', '로그인 세션을 찾을 수 없습니다.')
        router.replace(`/auth/error?${errorParams.toString()}`)

      } catch (error) {
        console.error('❌ Auth callback error:', error)
        const errorParams = new URLSearchParams()
        errorParams.set('error', 'unexpected_error')
        errorParams.set('error_description', '예상치 못한 오류가 발생했습니다.')
        router.replace(`/auth/error?${errorParams.toString()}`)
      }
    }

    // 이미 로그인 상태면 처리하지 않음
    if (!isAuthenticated && !loading) {
      handleAuthCallback()
    }
  }, [router, searchParams, isAuthenticated, loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b975ff] mx-auto mb-4"></div>
        <p>로그인 처리 중...</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
} 