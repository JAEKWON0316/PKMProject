'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // URL 파라미터에서 에러 확인
        const urlError = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (urlError) {
          console.error('Auth error:', urlError, errorDescription)
          // 에러 페이지로 리다이렉트
          const errorParams = new URLSearchParams()
          errorParams.set('error', urlError)
          if (errorDescription) errorParams.set('error_description', errorDescription)
          router.replace(`/auth/error?${errorParams.toString()}`)
          return
        }

        // 세션 확인
        const { data: session, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          const errorParams = new URLSearchParams()
          errorParams.set('error', 'session_error')
          errorParams.set('error_description', '세션을 가져오는데 실패했습니다.')
          router.replace(`/auth/error?${errorParams.toString()}`)
          return
        }

        if (session?.session) {
          // 세션이 있으면 바로 메인페이지로 이동
          router.replace('/')
          return
        }

        // 세션이 없는 경우 잠깐 기다려봄 (OAuth 처리 시간)
        setTimeout(async () => {
          const { data: retrySession } = await supabase.auth.getSession()
          if (retrySession?.session) {
            router.replace('/')
          } else {
            const errorParams = new URLSearchParams()
            errorParams.set('error', 'login_incomplete')
            errorParams.set('error_description', '로그인을 완료할 수 없습니다.')
            router.replace(`/auth/error?${errorParams.toString()}`)
          }
        }, 1000)

      } catch (error) {
        console.error('Auth callback error:', error)
        const errorParams = new URLSearchParams()
        errorParams.set('error', 'unexpected_error')
        errorParams.set('error_description', '예상치 못한 오류가 발생했습니다.')
        router.replace(`/auth/error?${errorParams.toString()}`)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  // 처리 중에는 아무것도 표시하지 않음
  return null
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