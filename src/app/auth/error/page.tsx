'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthError() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return '로그인이 취소되었습니다.'
      case 'server_error':
        return '서버 오류가 발생했습니다.'
      case 'temporarily_unavailable':
        return '서비스가 일시적으로 사용할 수 없습니다.'
      default:
        return errorDescription || '알 수 없는 오류가 발생했습니다.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            로그인 실패
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage()}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full"
          >
            다시 로그인하기
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            메인 페이지로 돌아가기
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-500">
              에러 코드: {error}
            </p>
            {errorDescription && (
              <p className="text-xs text-gray-500 mt-1">
                상세: {errorDescription}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 