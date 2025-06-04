import { getSupabaseClient } from './supabase'
import bcrypt from 'bcryptjs'

const supabase = getSupabaseClient()

// 인증 결과 타입
export interface AuthResult {
  success: boolean
  message: string
  user?: any
  error?: string
  isNewUser?: boolean  // 새 사용자인지 기존 사용자인지 구분
  otpSent?: boolean    // OTP 코드 발송 여부
  email?: string       // 이메일 주소
}

// 새로운 OTP 회원가입 데이터 타입
export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

// 1. OTP 코드 전송 (이메일로 6자리 코드 받기)
export async function sendOtpCode(email: string): Promise<AuthResult> {
  try {
    // 모든 사용자에게 OTP 코드 발송 (새 사용자든 기존 사용자든)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // 새 사용자면 생성, 기존 사용자면 로그인
        emailRedirectTo: undefined, // magic link 완전 비활성화
        captchaToken: undefined, // 캡차 비활성화
        data: {
          otp_type: 'code_only', // 코드 전용 모드 표시
          email_otp: true // 이메일 OTP 강제
        }
      }
    })

    if (error) {
      return {
        success: false,
        message: '이메일 발송에 실패했습니다.',
        error: error.message
      }
    }

    return {
      success: true,
      message: '6자리 인증 코드를 이메일로 발송했습니다. 코드를 입력해주세요.',
      isNewUser: true // 모든 사용자가 코드 입력 모드
    }
  } catch (error) {
    console.error('OTP 코드 전송 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 2. OTP 코드 검증 및 로그인
export async function verifyOtpCode(email: string, token: string): Promise<AuthResult> {
  try {
    // 모든 사용자에게 동일한 email OTP 검증 사용
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      let message = '코드 인증에 실패했습니다.'
      
      if (error.message.includes('Invalid token') || error.message.includes('Token has expired')) {
        message = '코드가 올바르지 않거나 만료되었습니다. 다시 시도해주세요.'
      } else if (error.message.includes('Email rate limit exceeded')) {
        message = '너무 많은 시도를 하셨습니다. 잠시 후 다시 시도해주세요.'
      }

      return {
        success: false,
        message,
        error: error.message
      }
    }

    return {
      success: true,
      message: '로그인 성공!',
      user: data.user
    }
  } catch (error) {
    console.error('OTP 코드 검증 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 3. 이메일/비밀번호 로그인
export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    // 먼저 Supabase 기본 비밀번호 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // 기본 로그인 실패 시 커스텀 로그인 시도 (호환성)
      console.log('기본 로그인 실패, 커스텀 로그인 시도:', error.message)
      
      const customResult = await signInWithCustomPassword(email, password)
      return customResult
    }

    console.log('✅ 기본 비밀번호 로그인 성공:', data.user?.email)
    return {
      success: true,
      message: '로그인 성공!',
      user: data.user
    }
  } catch (error) {
    console.error('비밀번호 로그인 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 4. Google OAuth 로그인
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // 배포 환경에서는 환경 변수 사용, 개발 환경에서는 현재 origin 사용
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/auth/callback`
      }
    })

    if (error) {
      return {
        success: false,
        message: 'Google 로그인에 실패했습니다.',
        error: error.message
      }
    }

    // OAuth는 리다이렉트되므로 즉시 결과를 알 수 없음
    return {
      success: true,
      message: 'Google 로그인을 진행합니다...'
    }
  } catch (error) {
    console.error('Google OAuth 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 5. 새로운 OTP 기반 회원가입 - 1단계: 이메일/비밀번호 저장 후 OTP 코드 발송
export async function signUpWithOtp(signUpData: SignUpData): Promise<AuthResult> {
  try {
    const { email, password, fullName } = signUpData

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return {
        success: false,
        message: '비밀번호는 최소 8자 이상이어야 합니다.'
      }
    }

    // 임시로 회원가입 데이터를 세션 스토리지에 저장
    sessionStorage.setItem('pendingSignUp', JSON.stringify({
      email,
      password,
      fullName: fullName || ''
    }))

    // OTP 코드 발송
    const otpResult = await sendOtpCode(email)
    
    if (!otpResult.success) {
      sessionStorage.removeItem('pendingSignUp')
      return otpResult
    }

    return {
      success: true,
      message: '6자리 인증 코드를 이메일로 발송했습니다. 코드를 입력해주세요.',
      isNewUser: true
    }
  } catch (error) {
    console.error('OTP 회원가입 오류:', error)
    sessionStorage.removeItem('pendingSignUp')
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 6. OTP 회원가입 완료 - 2단계: OTP 검증 후 비밀번호 해시 저장
export async function completeSignUpWithOtp(email: string, token: string): Promise<AuthResult> {
  try {
    // 저장된 회원가입 데이터 가져오기
    const pendingData = sessionStorage.getItem('pendingSignUp')
    if (!pendingData) {
      return {
        success: false,
        message: '회원가입 세션이 만료되었습니다. 다시 시도해주세요.'
      }
    }

    const signUpData = JSON.parse(pendingData) as SignUpData

    // OTP 코드 검증
    const otpResult = await verifyOtpCode(email, token)
    if (!otpResult.success) {
      return otpResult
    }

    // OTP 인증 성공 시 Supabase auth에 비밀번호도 설정
    try {
      // 이미 로그인된 상태이므로 현재 사용자의 비밀번호를 업데이트
      const { data: updateResult, error: updateError } = await supabase.auth.updateUser({
        password: signUpData.password,
        data: {
          full_name: signUpData.fullName
        }
      })

      if (updateError) {
        console.error('Auth 비밀번호 업데이트 오류:', updateError)
        // 실패해도 계속 진행 (OTP 로그인은 성공했으므로)
      } else {
        console.log('✅ Auth 테이블에 비밀번호 업데이트 완료')
      }
    } catch (authError) {
      console.error('Auth 업데이트 실패:', authError)
      // 실패해도 계속 진행
    }

    // 비밀번호 해시화하여 profiles 테이블에도 저장 (백업용)
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(signUpData.password, saltRounds)

    // profiles 테이블에 사용자 정보 저장/업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: otpResult.user?.id,
        email: signUpData.email,
        full_name: signUpData.fullName,
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('프로필 저장 오류:', profileError)
      // 비밀번호 해시 저장에 실패해도 OTP 로그인은 성공으로 처리
    }

    // 임시 데이터 정리
    sessionStorage.removeItem('pendingSignUp')

    return {
      success: true,
      message: '회원가입이 완료되었습니다!',
      user: otpResult.user
    }
  } catch (error) {
    console.error('OTP 회원가입 완료 오류:', error)
    sessionStorage.removeItem('pendingSignUp')
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 7. 커스텀 비밀번호 로그인 (API Route 사용)
export async function signInWithCustomPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/password-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: result.error
      }
    }

    // 직접 세션이 있는 경우 (password_direct)
    if (result.loginMethod === 'password_direct' && result.session) {
      console.log('🔐 직접 비밀번호 로그인: 세션 설정')
      
      const { data, error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token
      })

      if (error) {
        console.error('❌ 세션 설정 실패:', error)
        return {
          success: false,
          message: '세션 설정에 실패했습니다.',
          error: error.message
        }
      }

      console.log('✅ 비밀번호 로그인 성공:', data.user?.email)
      return {
        success: true,
        message: '로그인 성공!',
        user: data.user
      }
    }

    // 비밀번호 검증 완료된 경우 - OTP 없이 바로 성공 처리
    if (result.loginMethod === 'password_verified') {
      console.log('🔐 비밀번호 검증 완료 - 바로 로그인 처리')
      
      // 수동 인증이 필요한 경우
      if (result.requiresManualAuth && result.user) {
        // 임시로 세션 없이 사용자 상태만 설정
        console.log('✅ 수동 인증으로 로그인 상태 설정')
        
        // localStorage에 임시 사용자 정보 저장 (AuthContext에서 읽을 수 있도록)
        if (typeof window !== 'undefined') {
          localStorage.setItem('temp_auth_user', JSON.stringify(result.user))
          localStorage.setItem('temp_auth_verified', 'true')
        }
        
        return {
          success: true,
          message: '로그인 성공!',
          user: result.user
        }
      }
      
      // 사용자 정보가 있으면 바로 성공으로 처리
      if (result.user) {
        return {
          success: true,
          message: '로그인 성공!',
          user: result.user
        }
      }
    }

    // 기존 세션 토큰 방식 (호환성)
    if (result.session?.access_token && result.session?.refresh_token) {
      console.log('🔐 비밀번호 로그인: 세션 설정')
      
      const { data, error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token
      })

      if (error) {
        console.error('❌ 세션 설정 실패:', error)
        return {
          success: false,
          message: '세션 설정에 실패했습니다.',
          error: error.message
        }
      }

      console.log('✅ 비밀번호 로그인 성공:', data.user?.email)
      return {
        success: true,
        message: result.message,
        user: data.user
      }
    }

    return {
      success: true,
      message: result.message,
      user: result.user
    }
  } catch (error) {
    console.error('비밀번호 로그인 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 기존 함수들은 호환성을 위해 유지
export async function signUp(email: string, password: string, fullName?: string): Promise<AuthResult> {
  // 새로운 OTP 방식으로 리다이렉트
  return signUpWithOtp({ email, password, fullName })
}

// 8. OTP 기반 비밀번호 재설정 - 1단계: 재설정 코드 발송
export async function sendPasswordResetOtp(email: string): Promise<AuthResult> {
  try {
    // 새로운 API를 통해 비밀번호 재설정 OTP 발송
    const response = await fetch('/api/auth/send-reset-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: result.error
      }
    }

    return {
      success: true,
      message: result.message
    }
  } catch (error) {
    console.error('비밀번호 재설정 OTP 발송 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 9. OTP 기반 비밀번호 재설정 - 2단계: 코드 검증
export async function verifyPasswordResetOtp(email: string, token: string): Promise<AuthResult> {
  try {
    // 새로운 API를 통해 OTP 검증
    const response = await fetch('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, token })
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: result.error
      }
    }

    // 임시 토큰을 세션에 저장하여 비밀번호 재설정 권한 부여
    sessionStorage.setItem('passwordResetSession', JSON.stringify({
      email,
      verified: true,
      timestamp: Date.now(),
      resetToken: result.resetToken
    }))

    return {
      success: true,
      message: result.message,
      user: result.user
    }
  } catch (error) {
    console.error('비밀번호 재설정 OTP 검증 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 10. OTP 기반 비밀번호 재설정 - 3단계: 새 비밀번호 설정
export async function resetPasswordWithOtp(email: string, newPassword: string): Promise<AuthResult> {
  try {
    // 세션에서 검증된 정보 확인
    const resetSession = sessionStorage.getItem('passwordResetSession')
    if (!resetSession) {
      return {
        success: false,
        message: '비밀번호 재설정 권한이 없습니다. 다시 시도해주세요.'
      }
    }

    const sessionData = JSON.parse(resetSession)
    
    // 세션 유효성 검증 (10분 제한)
    const sessionAge = Date.now() - sessionData.timestamp
    if (sessionAge > 10 * 60 * 1000) { // 10분
      sessionStorage.removeItem('passwordResetSession')
      return {
        success: false,
        message: '세션이 만료되었습니다. 다시 시도해주세요.'
      }
    }

    // 이메일 일치 확인
    if (sessionData.email !== email) {
      return {
        success: false,
        message: '이메일이 일치하지 않습니다.'
      }
    }

    // 검증 상태 확인
    if (!sessionData.verified) {
      return {
        success: false,
        message: '코드 인증이 완료되지 않았습니다.'
      }
    }

    // API를 통해 비밀번호 업데이트
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        newPassword,
        resetToken: sessionData.resetToken
      })
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: result.error
      }
    }

    // 성공 시 세션 정리
    sessionStorage.removeItem('passwordResetSession')

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.'
    }
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 기존 resetPassword 함수는 호환성을 위해 유지하되 OTP 방식으로 변경
export async function resetPassword(email: string): Promise<AuthResult> {
  return sendPasswordResetOtp(email)
}

// 9. 로그아웃
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        message: '로그아웃에 실패했습니다.',
        error: error.message
      }
    }

    return {
      success: true,
      message: '로그아웃되었습니다.'
    }
  } catch (error) {
    console.error('로그아웃 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 10. 현재 사용자 정보 가져오기
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('사용자 정보 가져오기 오류:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('getCurrentUser 오류:', error)
    return null
  }
}

// 11. 세션 상태 확인
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('세션 가져오기 오류:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('getSession 오류:', error)
    return null
  }
}

// 12. 인증 상태 변화 리스너
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// 13. 사용자 프로필 가져오기
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('프로필 가져오기 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('getUserProfile 오류:', error)
    return null
  }
}

// 14. 사용자 프로필 업데이트
export async function updateUserProfile(userId: string, updates: { 
  full_name?: string
  avatar_url?: string 
}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: '프로필 업데이트에 실패했습니다.',
        error: error.message
      }
    }

    return {
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data
    }
  } catch (error) {
    console.error('프로필 업데이트 오류:', error)
    return {
      success: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 