// PKM AI Stripe 상품/플랜 정보 (실제 Price ID는 Stripe Dashboard에서 복사해 교체)
export const PRODUCTS = {
  PRO_MONTHLY: {
    id: 'pro_monthly',
    name: 'Pro (월간)',
    description: '개인 사용자를 위한 완전한 기능',
    priceId: 'price_1RWVJHIOkfG505aAZC7AUz1q', // Stripe Price ID로 교체
    type: 'recurring',
    amount: 19900,
    currency: 'KRW',
    period: 'month',
    features: [
      '무제한 대화 저장',
      '고급 RAG 검색 (무제한)',
      '모든 AI 모델 접근',
      '파일 업로드 (월 1GB)',
      '대화 분석 및 인사이트',
      '우선순위 지원',
      '고급 필터링 및 검색',
      '데이터 내보내기',
      '대화 공유 기능',
    ],
  },
  PRO_YEARLY: {
    id: 'pro_yearly',
    name: 'Pro (연간)',
    description: 'Pro 월간의 20% 할인 연간 결제',
    priceId: 'price_1RWVPDIOkfG505aAzuVYnKPM', // Stripe Price ID로 교체
    type: 'recurring',
    amount: 19900 * 12 * 0.8, // 20% 할인
    currency: 'KRW',
    period: 'year',
    features: [
      '무제한 대화 저장',
      '고급 RAG 검색 (무제한)',
      '모든 AI 모델 접근',
      '파일 업로드 (월 1GB)',
      '대화 분석 및 인사이트',
      '우선순위 지원',
      '고급 필터링 및 검색',
      '데이터 내보내기',
      '대화 공유 기능',
    ],
  },
  TEAM_MONTHLY: {
    id: 'team_monthly',
    name: 'Team (월간)',
    description: '팀과 협업을 위한 고급 기능',
    priceId: 'price_1RWVKAIOkfG505aA773vW5L9', // Stripe Price ID로 교체
    type: 'recurring',
    amount: 49900,
    currency: 'KRW',
    period: 'month',
    features: [
      'Pro의 모든 기능',
      '팀 워크스페이스',
      '대화 공유 및 협업',
      '팀 분석 대시보드',
      '사용자 관리',
      '파일 업로드 (월 5GB)',
      'API 접근',
      '커스텀 통합',
      '전담 지원',
    ],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: '대기업을 위한 맞춤형 솔루션',
    priceId: '', // 문의 필요, 결제 대상 아님
    type: 'custom',
    amount: 0,
    currency: 'KRW',
    period: 'custom',
    features: [
      'Team의 모든 기능',
      '무제한 사용자',
      '온프레미스 배포 옵션',
      '고급 보안 및 컴플라이언스',
      '커스텀 AI 모델 훈련',
      '24/7 전담 지원',
      'SLA 보장',
      '커스텀 개발',
      '무제한 스토리지',
    ],
  },
}; 