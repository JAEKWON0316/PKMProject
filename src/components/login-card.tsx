"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Apple, Github, X, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  sendOtpCode,
  verifyOtpCode,
  signInWithPassword, 
  signInWithGoogle, 
  signUp, 
  signUpWithOtp,
  completeSignUpWithOtp,
  resetPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
  AuthResult,
  setAuthCookieFromLocalStorage
} from "@/lib/auth"
import { useAuth } from "@/contexts/AuthContext"

interface LoginCardProps {
  resetToEmailMode?: boolean
  onPasswordModeChange?: (usePassword: boolean) => void
  onClose?: () => void
  onBack?: () => void
  showBackButton?: boolean
}

export function LoginCard({ resetToEmailMode, onPasswordModeChange, onClose, onBack, showBackButton }: LoginCardProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [usePassword, setUsePassword] = useState(false)
  const [passwordResetMode, setPasswordResetMode] = useState(false)
  const [passwordResetOtpMode, setPasswordResetOtpMode] = useState(false)
  const [passwordResetNewPasswordMode, setPasswordResetNewPasswordMode] = useState(false)
  const [signupMode, setSignupMode] = useState(false)
  const [otpMode, setOtpMode] = useState(false)
  const [isSignupOtpMode, setIsSignupOtpMode] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [newPasswordError, setNewPasswordError] = useState("")
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState("")
  const [otpError, setOtpError] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [otpSentEmail, setOtpSentEmail] = useState("")

  // 이메일 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // 비밀번호 정규식 (최소 8자, 대문자, 소문자, 숫자 각각 최소 1개)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

  // 인증 성공 시 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // resetToEmailMode prop이 true일 때 이메일 모드로 초기화
  useEffect(() => {
    if (resetToEmailMode) {
      setUsePassword(false)
      setOtpMode(false)
      setIsSignupOtpMode(false)
      setPasswordResetMode(false)
      setPasswordResetOtpMode(false)
      setPasswordResetNewPasswordMode(false)
      setPassword("")
      setConfirmPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setFullName("")
      setOtpCode("")
      setOtpSentEmail("")
      setSignupMode(false)
      setEmailError("")
      setPasswordError("")
      setConfirmPasswordError("")
      setNewPasswordError("")
      setConfirmNewPasswordError("")
      setOtpError("")
      setSuccessMessage("")
      setErrorMessage("")
    }
  }, [resetToEmailMode])

  // usePassword 상태 변경 시 부모에게 알림
  useEffect(() => {
    onPasswordModeChange?.(usePassword || passwordResetMode || passwordResetOtpMode || passwordResetNewPasswordMode || signupMode)
  }, [usePassword, passwordResetMode, passwordResetOtpMode, passwordResetNewPasswordMode, signupMode, onPasswordModeChange])

  // 이메일 검증
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("")
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError("올바른 이메일 형식을 입력하세요")
      return false
    }
    setEmailError("")
    return true
  }

  // 비밀번호 검증
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("")
      return false
    }
    if (!passwordRegex.test(password)) {
      setPasswordError("최소 8자, 대문자, 소문자, 숫자를 각각 포함해야 합니다")
      return false
    }
    setPasswordError("")
    return true
  }

  // 새 비밀번호 검증
  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError("")
      return false
    }
    if (!passwordRegex.test(password)) {
      setNewPasswordError("최소 8자, 대문자, 소문자, 숫자를 각각 포함해야 합니다")
      return false
    }
    setNewPasswordError("")
    return true
  }

  // 비밀번호 확인 검증
  const validateConfirmPassword = (confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmPasswordError("")
      return false
    }
    if (confirmPwd !== password) {
      setConfirmPasswordError("비밀번호가 일치하지 않습니다")
      return false
    }
    setConfirmPasswordError("")
    return true
  }

  // 새 비밀번호 확인 검증
  const validateConfirmNewPassword = (confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmNewPasswordError("")
      return false
    }
    if (confirmPwd !== newPassword) {
      setConfirmNewPasswordError("비밀번호가 일치하지 않습니다")
      return false
    }
    setConfirmNewPasswordError("")
    return true
  }

  // OTP 코드 검증
  const validateOtpCode = (code: string) => {
    if (!code) {
      setOtpError("")
      return false
    }
    if (!/^\d{6}$/.test(code)) {
      setOtpError("6자리 숫자를 입력해주세요")
      return false
    }
    setOtpError("")
    return true
  }

  // 메시지 표시 헬퍼
  const showResult = async (result: AuthResult) => {
    if (result.success) {
      // 로그인 성공 시 쿠키 복사 및 새로고침 (SSR 인증 보장)
      if (result.user && (otpMode || usePassword)) {
        setAuthCookieFromLocalStorage();
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return;
      }
      // 일반적인 성공 메시지 (코드 발송 등)
      setSuccessMessage(result.message)
      setErrorMessage("")
    } else {
      setErrorMessage(result.message)
      setSuccessMessage("")
    }
  }

  // 비밀번호 모드 전환 함수
  const handlePasswordModeToggle = () => {
    setUsePassword(true)
    setSignupMode(false)
    setSuccessMessage("")
    setErrorMessage("")
  }

  // 비밀번호 재설정 모드 전환 함수
  const handlePasswordResetMode = () => {
    setPasswordResetMode(true)
    setPasswordResetOtpMode(false)
    setPasswordResetNewPasswordMode(false)
    setUsePassword(false)
    setSignupMode(false)
    setOtpMode(false)
    setSuccessMessage("")
    setErrorMessage("")
  }

  // 비밀번호 재설정 OTP 모드 전환 함수
  const handlePasswordResetOtpMode = () => {
    setPasswordResetOtpMode(true)
    setPasswordResetMode(false)
    setPasswordResetNewPasswordMode(false)
    setUsePassword(false)
    setSignupMode(false)
    setOtpMode(false)
    setSuccessMessage("")
    setErrorMessage("")
  }

  // 비밀번호 재설정 새 비밀번호 모드 전환 함수
  const handlePasswordResetNewPasswordMode = () => {
    setPasswordResetNewPasswordMode(true)
    setPasswordResetOtpMode(false)
    setPasswordResetMode(false)
    setUsePassword(false)
    setSignupMode(false)
    setOtpMode(false)
    setSuccessMessage("")
    setErrorMessage("")
  }

  // 가입 모드 전환 함수
  const handleSignupMode = () => {
    setSignupMode(true)
    setUsePassword(false)
    setPasswordResetMode(false)
    setPasswordResetOtpMode(false)
    setPasswordResetNewPasswordMode(false)
    setSuccessMessage("")
    setErrorMessage("")
  }

  // 로그인 모드로 돌아가기
  const handleBackToLogin = () => {
    setSignupMode(false)
    setUsePassword(false)
    setPasswordResetMode(false)
    setPasswordResetOtpMode(false)
    setPasswordResetNewPasswordMode(false)
    setOtpMode(false)
    setIsSignupOtpMode(false)
    setSuccessMessage("")
    setErrorMessage("")
  }

  // OTP 모드로 전환
  const handleOtpMode = () => {
    setOtpMode(false)
    setIsSignupOtpMode(false)
    setUsePassword(false)
    setSignupMode(false)
    setPasswordResetMode(false)
    setPasswordResetOtpMode(false)
    setPasswordResetNewPasswordMode(false)
    setOtpCode("")
    setOtpSentEmail("")
    setSuccessMessage("")
    setErrorMessage("")
  }

  // 새 코드 요청 (일반 로그인용)
  const handleRequestNewCode = async () => {
    if (loading || !otpSentEmail) return
    
    setLoading(true)
    try {
      const result = await sendOtpCode(otpSentEmail)
      await showResult(result)
      if (result.success) {
        setOtpCode("") // 코드 입력 필드 초기화
      }
    } finally {
      setLoading(false)
    }
  }

  // 새 재설정 코드 요청
  const handleRequestNewResetCode = async () => {
    if (loading || !otpSentEmail) return
    
    setLoading(true)
    try {
      const result = await sendPasswordResetOtp(otpSentEmail)
      await showResult(result)
      if (result.success) {
        setOtpCode("") // 코드 입력 필드 초기화
      }
    } finally {
      setLoading(false)
    }
  }

  // Google 로그인 처리
  const handleGoogleLogin = async () => {
    setLoading(true)
    setSuccessMessage("")
    setErrorMessage("")
    
    try {
      const result = await signInWithGoogle()
      await showResult(result)
    } catch (error) {
      setErrorMessage("Google 로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 제출 처리
  const handleSubmit = async () => {
    if (loading) return

    setLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      if (otpMode) {
        // OTP 코드 검증 모드
        const isOtpValid = validateOtpCode(otpCode)
        if (isOtpValid && otpSentEmail) {
          let result: AuthResult
          
          if (isSignupOtpMode) {
            // 회원가입 OTP 검증
            result = await completeSignUpWithOtp(otpSentEmail, otpCode)
          } else {
            // 일반 로그인 OTP 검증
            result = await verifyOtpCode(otpSentEmail, otpCode)
          }
          
          await showResult(result)
          // 로그인 성공 시 로딩 상태 유지 (showResult에서 처리)
          if (result.success && result.user) return
        }
      } else if (signupMode) {
        const isEmailValid = validateEmail(email)
        const isPasswordValid = validatePassword(password)
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)
        
        if (isEmailValid && isPasswordValid && isConfirmPasswordValid) {
          // 새로운 OTP 기반 회원가입 사용
          const result = await signUpWithOtp({ email, password, fullName })
          if (result.success) {
            setOtpSentEmail(email)
            setOtpMode(true)
            setIsSignupOtpMode(true) // 회원가입 OTP 모드로 설정
          }
          await showResult(result)
        }
      } else if (passwordResetMode) {
        const isEmailValid = validateEmail(email)
        if (isEmailValid) {
          const result = await sendPasswordResetOtp(email)
          if (result.success) {
            setOtpSentEmail(email)
            setPasswordResetOtpMode(true)
            setPasswordResetMode(false)
          }
          await showResult(result)
        }
      } else if (passwordResetOtpMode) {
        const isOtpValid = validateOtpCode(otpCode)
        if (isOtpValid && otpSentEmail) {
          const result = await verifyPasswordResetOtp(otpSentEmail, otpCode)
          if (result.success) {
            setPasswordResetNewPasswordMode(true)
            setPasswordResetOtpMode(false)
          }
          await showResult(result)
        }
      } else if (passwordResetNewPasswordMode) {
        const isNewPasswordValid = validateNewPassword(newPassword)
        const isConfirmNewPasswordValid = validateConfirmNewPassword(confirmNewPassword)
        
        if (isNewPasswordValid && isConfirmNewPasswordValid && otpSentEmail) {
          const result = await resetPasswordWithOtp(otpSentEmail, newPassword)
          if (result.success) {
            // 성공 시 로그인 모드로 돌아가기
            setPasswordResetNewPasswordMode(false)
            setUsePassword(true)
            setNewPassword("")
            setConfirmNewPassword("")
            setOtpCode("")
            setOtpSentEmail("")
          }
          await showResult(result)
        }
      } else if (usePassword) {
        const isEmailValid = validateEmail(email)
        if (isEmailValid && password) {
          const result = await signInWithPassword(email, password)
          
          // 비밀번호 로그인 성공 시 바로 처리 (OTP 단계 건너뛰기)
          await showResult(result)
          // 로그인 성공 시 로딩 상태 유지 (showResult에서 처리)
          if (result.success && result.user) return
        }
      } else {
        // OTP 코드 전송 모드 (기본)
        const isEmailValid = validateEmail(email)
        if (isEmailValid) {
          const result = await sendOtpCode(email)
          if (result.success) {
            setOtpSentEmail(email)
            // 모든 사용자가 OTP 모드로 진입
            setOtpMode(true)
          }
          await showResult(result)
        }
      }
    } catch (error) {
      setErrorMessage("예상치 못한 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-xl bg-[#1a1a1a] p-4 sm:p-8 text-white shadow-xl">
      {/* 뒤로가기 버튼 (좌측상단) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 rounded-full bg-gray-800 p-1.5 sm:p-2 text-white hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
      
      {/* 닫기 버튼 (우측상단) */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 rounded-full bg-gray-800 p-1.5 sm:p-2 text-white hover:bg-gray-700 transition-colors"
      >
        <X className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div className="mb-4 sm:mb-8 flex justify-center">
        <div className="relative h-12 w-12 sm:h-20 sm:w-20">
          <Image
            src="/pkmlogo006.png"
            alt="PKM Brain Logo"
            width={80}
            height={80}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>

      <h1 className={`text-center text-xl sm:text-2xl font-bold ${passwordResetMode || signupMode || otpMode ? 'mb-4 sm:mb-6' : 'mb-6 sm:mb-10'}`}>
        {passwordResetMode ? (
          "비밀번호를 재설정하세요"
        ) : signupMode ? (
          "계정을 생성하세요"
        ) : otpMode ? (
          "인증 코드를 입력하세요"
        ) : (
          <>
            <span className="text-[#b975ff]">pkm</span>에 오신 것을 환영합니다.
          </>
        )}
      </h1>

      {/* 성공/에러 메시지 */}
      {(successMessage || errorMessage) && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          successMessage 
            ? 'bg-green-900/20 text-green-400 border border-green-900/40' 
            : 'bg-red-900/20 text-red-400 border border-red-900/40'
        }`}>
          {successMessage || errorMessage}
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <p className="mb-3 text-center text-sm font-light">
          {passwordResetMode 
            ? "재설정 링크를 받을 이메일을 입력하세요."
            : signupMode
            ? "시작하려면 가입하세요."
            : otpMode
            ? `${otpSentEmail}로 발송된 6자리 인증 코드를 입력하세요.`
            : usePassword 
            ? "로그인하려면 이메일과 비밀번호를 입력하세요." 
            : "시작하려면 이메일을 입력하세요."
          }
        </p>
        
        {/* 이름 입력 (회원가입 모드에서만) */}
        {signupMode && (
          <div className="relative mb-4">
            <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">이름 (선택사항)</label>
            <Input
              type="text"
              placeholder="홍길동"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border border-[#333] bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        )}
        
        {/* 이메일 입력 */}
        {!otpMode && (
          <div className="relative mb-4">
            <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">이메일</label>
            <Input
              type="email"
              placeholder="yours@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (e.target.value) validateEmail(e.target.value)
              }}
              className={`border ${emailError ? 'border-red-500' : 'border-[#333]'} bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0`}
            />
            {emailError && (
              <p className="text-red-400 text-xs mt-1 ml-3">{emailError}</p>
            )}
          </div>
        )}

        {/* OTP 코드 입력 (OTP 모드 또는 비밀번호 재설정 OTP 모드에서) */}
        {(otpMode || passwordResetOtpMode) && (
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">
              {passwordResetOtpMode ? "재설정 코드" : "인증 코드"}
            </label>
            <Input
              type="text"
              placeholder={passwordResetOtpMode ? "이메일로 받은 6자리 재설정 코드" : "이메일로 받은 6자리 코드"}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value)
                if (e.target.value) validateOtpCode(e.target.value)
              }}
              className={`border ${otpError ? 'border-red-500' : 'border-[#333]'} bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0`}
              maxLength={6}
            />
            {otpError && (
              <p className="text-red-400 text-xs mt-1 ml-3">{otpError}</p>
            )}
          </div>
        )}

        {/* 새 비밀번호 입력 (비밀번호 재설정 새 비밀번호 모드에서) */}
        {passwordResetNewPasswordMode && (
          <>
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">새 비밀번호</label>
              <Input
                type="password"
                placeholder="새 비밀번호를 입력하세요"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (e.target.value) validateNewPassword(e.target.value)
                  if (confirmNewPassword) validateConfirmNewPassword(confirmNewPassword)
                }}
                className={`border ${newPasswordError ? 'border-red-500' : 'border-[#333]'} bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0`}
              />
              {newPasswordError && (
                <p className="text-red-400 text-xs mt-1 ml-3">{newPasswordError}</p>
              )}
            </div>
            
            <div className="relative mt-6">
              <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">새 비밀번호 확인</label>
              <Input
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value)
                  if (e.target.value) validateConfirmNewPassword(e.target.value)
                }}
                className={`border ${confirmNewPasswordError ? 'border-red-500' : 'border-[#333]'} bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0`}
              />
              {confirmNewPasswordError && (
                <p className="text-red-400 text-xs mt-1 ml-3">{confirmNewPasswordError}</p>
              )}
            </div>
          </>
        )}

        {/* 비밀번호 입력 (비밀번호 모드 또는 가입 모드에서) */}
        {(usePassword || signupMode) && !otpMode && !passwordResetMode && !passwordResetOtpMode && !passwordResetNewPasswordMode && (
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">비밀번호</label>
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (e.target.value) validatePassword(e.target.value)
                if (confirmPassword) validateConfirmPassword(confirmPassword)
              }}
              className={`border ${passwordError ? 'border-red-500' : 'border-[#333]'} bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0`}
            />
            {passwordError && (
              <p className="text-red-400 text-xs mt-1 ml-3">{passwordError}</p>
            )}
          </div>
        )}

        {/* 비밀번호 확인 입력 (가입 모드에서만) */}
        {signupMode && !otpMode && (
          <div className="relative mt-4">
            <label className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1 text-xs text-[#b975ff]">비밀번호 확인</label>
            <Input
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (e.target.value) validateConfirmPassword(e.target.value)
              }}
              className={`border ${confirmPasswordError ? 'border-red-500' : 'border-[#333]'} bg-transparent py-4 sm:py-6 pl-4 text-white focus:border-[#b975ff] focus-visible:ring-0 focus-visible:ring-offset-0`}
            />
            {confirmPasswordError && (
              <p className="text-red-400 text-xs mt-1 ml-3">{confirmPasswordError}</p>
            )}
          </div>
        )}
      </div>

      <Button
        className="w-full bg-[#b975ff] py-4 sm:py-6 text-base font-medium text-white hover:bg-[#a35ce0] disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>처리 중...</span>
          </div>
        ) : (
          passwordResetNewPasswordMode ? "비밀번호 재설정" :
          passwordResetOtpMode ? "코드 확인" :
          passwordResetMode ? "재설정 코드 보내기" :
          otpMode ? "코드 확인" :
          signupMode ? "가입하기" :
          usePassword ? "로그인" : "코드 받기"
        )}
      </Button>

      {!passwordResetMode && !passwordResetOtpMode && !passwordResetNewPasswordMode && !otpMode && (
        <>
          <div className="mt-3 sm:mt-4 text-center space-y-2">
            {!usePassword && !signupMode ? (
              <button 
                className="text-sm font-light text-[#b975ff] hover:underline"
                onClick={handlePasswordModeToggle}
              >
                비밀번호 사용
              </button>
            ) : usePassword ? (
              <>
                <div>
                  <span className="text-sm font-light text-gray-400">계정이 없으신가요? </span>
                  <button 
                    className="text-sm font-light text-[#b975ff] hover:underline"
                    onClick={handleSignupMode}
                  >
                    가입하기
                  </button>
                </div>
                <div>
                  <button 
                    className="text-sm font-light text-[#b975ff] hover:underline"
                    onClick={handlePasswordResetMode}
                  >
                    비밀번호 찾기
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {!signupMode && (
            <>
              <div className="my-6 sm:my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#333]"></div>
                <span className="text-sm text-gray-400">또는</span>
                <div className="h-px flex-1 bg-[#333]"></div>
              </div>

              <Button 
                className="mb-3 sm:mb-4 w-full justify-center gap-3 border border-[#333] bg-white py-4 sm:py-6 text-base font-medium text-black hover:bg-gray-100 disabled:opacity-50"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <GoogleIcon />
                <span>Google로 계속하기</span>
              </Button>

              <div className="mb-3 sm:mb-4 grid grid-cols-4 gap-3">
                <Button className="flex h-10 sm:h-12 w-full items-center justify-center rounded-md border border-[#333] bg-white p-0 text-black hover:bg-gray-100">
                  <Apple className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button className="flex h-10 sm:h-12 w-full items-center justify-center rounded-md border border-[#333] bg-black p-0 text-white hover:bg-gray-900">
                  <Github className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button className="flex h-10 sm:h-12 w-full items-center justify-center rounded-md border border-[#333] bg-[#1877F2] p-0 text-white hover:bg-[#166fe5]">
                  <FacebookIcon />
                </Button>
                <Button className="flex h-10 sm:h-12 w-full items-center justify-center rounded-md border border-[#333] bg-[#5865F2] p-0 text-white hover:bg-[#4752c4]">
                  <DiscordIcon />
                </Button>
              </div>
            </> 
          )}

          {signupMode && (
            <>
              <div className="my-6 sm:my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#333]"></div>
                <span className="text-sm text-gray-400">또는</span>
                <div className="h-px flex-1 bg-[#333]"></div>
              </div>

              <div className="text-center">
                <span className="text-sm font-light text-gray-400">이미 계정이 있으신가요? </span>
                <button 
                  className="text-sm font-light text-[#b975ff] hover:underline"
                  onClick={handleBackToLogin}
                >
                  로그인
                </button>
              </div>
            </>
          )}

          <div className="mt-6 sm:mt-10 text-center text-xs font-light text-gray-400">
            계속함으로써 귀하는 우리의{" "}
            <Link href="#" className="text-[#b975ff] hover:underline">
              서비스 약관
            </Link>{" "}
            및{" "}
            <Link href="#" className="text-[#b975ff] hover:underline">
              개인정보 보호정책
            </Link>
            에 동의하게 됩니다.
          </div>
        </>
      )}

      {/* 비밀번호 재설정 모드들에서 뒤로 가기 버튼 */}
      {(passwordResetMode || passwordResetOtpMode || passwordResetNewPasswordMode) && (
        <div className="mt-3 sm:mt-4 text-center">
          <button 
            className="text-sm font-light text-[#b975ff] hover:underline"
            onClick={handleBackToLogin}
          >
            ← 로그인으로 돌아가기
          </button>
        </div>
      )}

      {(otpMode && !passwordResetOtpMode) && (
        <div className="mt-3 sm:mt-4 text-center">
          <button 
            className="text-sm font-light text-[#b975ff] hover:underline"
            onClick={handleBackToLogin}
          >
            ← 다른 방법으로 로그인
          </button>
        </div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 17.9895 4.3882 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9701 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.34 7.875 13.875 8.80008 13.875 9.75V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9895 24 12Z"
        fill="white"
      />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
        fill="white"
      />
    </svg>
  )
}