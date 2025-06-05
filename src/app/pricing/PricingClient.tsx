"use client"

import { useState, useEffect } from "react"
import { Check, Zap, Crown, Star, MessageSquare, Database, Search, Users, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { PRODUCTS } from '@/utils/stripeProducts'
import { LoginModal } from '@/components/login-modal'

interface PricingPlan {
  id: string
  name: string
  description: string
  price: string
  originalPrice?: string
  period: string
  popular?: boolean
  icon: React.ElementType
  features: string[]
  limitations?: string[]
  buttonText: string
  buttonVariant: "default" | "outline" | "secondary"
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "PKM AI를 시작해보세요",
    price: "₩0",
    period: "영구 무료",
    icon: MessageSquare,
    features: [
      "월 50개 대화 저장",
      "기본 RAG 검색 (월 100회)",
      "대화 찾아보기 기능",
      "표준 AI 모델 사용",
      "커뮤니티 지원"
    ],
    limitations: [
      "고급 AI 모델 제한",
      "파일 업로드 제한",
      "우선 지원 없음"
    ],
    buttonText: "무료로 시작하기",
    buttonVariant: "outline"
  },
  {
    id: "pro",
    name: "Pro",
    description: "개인 사용자를 위한 완전한 기능",
    price: "₩19,900",
    originalPrice: "₩29,900",
    period: "월",
    popular: true,
    icon: Zap,
    features: [ 
      "무제한 대화 저장",
      "고급 RAG 검색 (무제한)",
      "모든 AI 모델 접근",
      "파일 업로드 (월 1GB)",
      "대화 분석 및 인사이트",
      "우선순위 지원",
      "고급 필터링 및 검색",
      "데이터 내보내기",
      "대화 공유 기능"
    ],
    buttonText: "Pro로 업그레이드",
    buttonVariant: "default"
  },
  {
    id: "team",
    name: "Team",
    description: "팀과 협업을 위한 고급 기능",
    price: "₩49,900",
    period: "월 (사용자당)",
    icon: Users,
    features: [
      "Pro의 모든 기능",
      "팀 워크스페이스",
      "대화 공유 및 협업",
      "팀 분석 대시보드",
      "사용자 관리",
      "파일 업로드 (월 5GB)",
      "API 접근",
      "커스텀 통합",
      "전담 지원"
    ],
    buttonText: "팀 플랜 시작",
    buttonVariant: "outline"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "대기업을 위한 맞춤형 솔루션",
    price: "문의",
    period: "맞춤 가격",
    icon: Crown,
    features: [
      "Team의 모든 기능",
      "무제한 사용자",
      "온프레미스 배포 옵션",
      "고급 보안 및 컴플라이언스",
      "커스텀 AI 모델 훈련",
      "24/7 전담 지원",
      "SLA 보장",
      "커스텀 개발",
      "무제한 스토리지"
    ],
    buttonText: "영업팀 문의",
    buttonVariant: "secondary"
  }
]

const faqData = [
  {
    id: 1,
    question: "플랜을 언제든지 변경할 수 있나요?",
    answer: "네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경사항은 다음 결제 주기부터 적용됩니다."
  },
  {
    id: 2,
    question: "무료 플랜에서 유료 플랜으로 업그레이드하면 어떻게 되나요?",
    answer: "기존에 저장된 모든 대화와 데이터는 그대로 유지되며, 즉시 유료 플랜의 모든 기능을 사용할 수 있습니다."
  },
  {
    id: 3,
    question: "팀 플랜에서 사용자를 추가/제거할 수 있나요?",
    answer: "네, 관리자는 언제든지 팀원을 추가하거나 제거할 수 있습니다. 요금은 실제 사용자 수에 따라 다음 결제 주기에 조정됩니다."
  },
  {
    id: 4,
    question: "환불 정책은 어떻게 되나요?",
    answer: "구독 후 7일 이내에 환불을 요청하실 수 있습니다. 단, 사용량에 관계없이 전액 환불해드립니다."
  },
  {
    id: 5,
    question: "데이터 보안은 어떻게 보장되나요?",
    answer: "모든 데이터는 암호화되어 저장되며, SOC2 및 GDPR 규정을 준수합니다. Enterprise 플랜에서는 추가 보안 옵션을 제공합니다."
  },
  {
    id: 6,
    question: "API 사용량 제한이 있나요?",
    answer: "Pro 플랜에서는 월 10,000 API 호출, Team 플랜에서는 월 100,000 API 호출을 제공합니다. Enterprise에서는 제한이 없습니다."
  }
]

export default function PricingClient() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, user } = useAuth()
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [activePlanName, setActivePlanName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveSub() {
      if (!user?.id) {
        setHasActiveSubscription(false);
        setActivePlanName(null);
        return;
      }
      try {
        const res = await fetch(`/api/payments/active-subscription?userId=${user.id}`);
        const data = await res.json();
        if (data.success && data.subscription) {
          setHasActiveSubscription(true);
          setActivePlanName(data.subscription.plan_name || null);
        } else {
          setHasActiveSubscription(false);
          setActivePlanName(null);
        }
      } catch {
        setHasActiveSubscription(false);
        setActivePlanName(null);
      }
    }
    fetchActiveSub();
  }, [user?.id]);

  const handleCheckout = async (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/';
      return;
    }
    if (planId === 'enterprise') {
      window.location.href = 'mailto:contact@pkmai.co.kr?subject=엔터프라이즈 플랜 문의';
      return;
    }
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    // 유료 플랜: productId 결정
    let productId = '';
    if (planId === 'pro') {
      productId = billingPeriod === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    } else if (planId === 'team') {
      productId = 'team_monthly'; // 팀은 연간 미지원
    }
    if (!productId) return;
    setLoading(planId);
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, userId: user?.id, email: user?.email }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || '결제 페이지 이동 실패');
      }
    } catch (err) {
      alert('결제 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  }

  const toggleFaq = (faqId: number) => {
    setOpenFaq(openFaq === faqId ? null : faqId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      {/* 헤더 섹션 */}
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            합리적인 가격으로 시작하는<br />AI 지식관리
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            PKM AI와 함께 더 스마트하게 대화하고, 지식을 관리하세요. 
            모든 플랜에는 핵심 기능이 포함되어 있습니다.
          </p>
          
          {/* 연간/월간 토글 */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-gray-800 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  20% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 가격 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon
            const yearlyPrice = plan.price !== "₩0" && plan.price !== "문의" 
              ? `₩${Math.round(parseInt(plan.price.replace(/₩|,/g, "")) * 0.8).toLocaleString()}`
              : plan.price

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "border-purple-500 shadow-lg shadow-purple-500/20 bg-gray-800"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-medium">
                    <Star className="inline-block w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? "pt-12" : "pt-6"}`}>
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.popular ? "bg-purple-600" : "bg-gray-700"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-white">
                        {billingPeriod === "yearly" ? yearlyPrice : plan.price}
                      </span>
                      {plan.period !== "맞춤 가격" && plan.period !== "영구 무료" && (
                        <span className="text-gray-400 ml-1">/{plan.period}</span>
                      )}
                    </div>
                    {plan.originalPrice && billingPeriod === "monthly" && (
                      <div className="text-sm text-gray-500 line-through">
                        {plan.originalPrice}
                      </div>
                    )}
                    {billingPeriod === "yearly" && plan.price !== "₩0" && plan.price !== "문의" && (
                      <div className="text-sm text-green-400">
                        연간 20% 할인 적용
                      </div>
                    )}
                    <div className="text-sm text-gray-400 mt-1">
                      {plan.period === "맞춤 가격" ? plan.period : 
                       plan.period === "영구 무료" ? plan.period :
                       billingPeriod === "yearly" ? "연간" : plan.period}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        : plan.buttonVariant === "outline"
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    variant={plan.popular ? "default" : plan.buttonVariant}
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id || hasActiveSubscription}
                  >
                    {hasActiveSubscription ? '이미 구독 중' : (loading === plan.id ? '처리 중...' : plan.buttonText)}
                  </Button>
                  {hasActiveSubscription && (
                    <div className="text-sm text-red-400 text-center mb-2">이미 구독 중입니다{activePlanName ? ` (${activePlanName})` : ''}. 구독 기간이 끝난 후 다시 결제할 수 있습니다.</div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">포함된 기능:</h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {plan.limitations && plan.limitations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">제한사항:</h4>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0">•</span>
                              <span className="text-sm text-gray-500">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ 섹션 */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            자주 묻는 질문
          </h2>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqData.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      openFaq === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/20">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              아직 질문이 있으신가요?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              PKM AI 팀이 도와드리겠습니다. 플랜 선택부터 기능 사용까지, 
              어떤 질문이든 편하게 문의해주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => window.location.href = "mailto:support@pkmai.co.kr"}
              >
                이메일로 문의하기
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => window.location.href = "/"}
              >
                무료로 시작하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 