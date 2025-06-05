import Stripe from 'stripe';
import SuccessCard from './SuccessCard';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function Page({ searchParams }: { searchParams: { session_id?: string } }) {
  const session_id = searchParams.session_id;
  if (!session_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md mx-auto bg-white/5 rounded-xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2">결제 세션 정보가 없습니다.</h1>
          <p className="text-gray-500 mb-6">정상적인 결제 후에만 접근 가능합니다.</p>
          <a href="/pricing" className="inline-block px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">가격 페이지로 돌아가기</a>
        </div>
      </div>
    );
  }

  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: [
        'customer',
        'subscription',
        'invoice',
        'line_items.data.price.product',
      ],
    });
  } catch (error) {
    // 예외처리
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md mx-auto bg-white/5 rounded-xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2">결제 정보를 불러올 수 없습니다.</h1>
          <p className="text-gray-500 mb-6">세션 ID가 올바르지 않거나, Stripe 서버와 통신에 문제가 있습니다.</p>
          <a href="/pricing" className="inline-block px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">가격 페이지로 돌아가기</a>
        </div>
      </div>
    );
  }

  // robust하게 값 추출
  const customerEmail = session.customer_details?.email || '';
  const customerName = session.customer_details?.name || '';

  // 구독 플랜명: line_items.data[0].price.product.name
  let planName = '';
  const lineItems = (session as any).line_items?.data;
  if (lineItems && lineItems.length > 0) {
    const price = lineItems[0].price;
    if (price && price.product && typeof price.product === 'object' && 'name' in price.product) {
      planName = price.product.name;
    }
  }

  // 구독 시작일/만료일: subscription.start_date, subscription.current_period_end
  let startDate = '';
  let endDate = '';
  if (session.subscription && typeof session.subscription === 'object') {
    const sub = session.subscription as any;
    if (sub.start_date) {
      startDate = new Date(sub.start_date * 1000).toISOString().slice(0, 10);
    }
    // Stripe API 2025+ 호환: subscription.items.data[0].current_period_end에서 추출
    if (Array.isArray(sub.items?.data) && sub.items.data.length > 0 && sub.items.data[0].current_period_end) {
      endDate = new Date(sub.items.data[0].current_period_end * 1000).toISOString().slice(0, 10);
    } else if (sub.current_period_end) {
      endDate = new Date(sub.current_period_end * 1000).toISOString().slice(0, 10);
    }
  }

  // 금액: KRW는 소수점 없이, 그 외는 소수점 2자리
  let amount = '';
  if (session.amount_total) {
    if (session.currency?.toUpperCase() === 'KRW') {
      amount = session.amount_total.toLocaleString();
    } else {
      amount = (session.amount_total / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900/90 to-gray-800/90">
      <SuccessCard
        customerEmail={customerEmail}
        customerName={customerName}
        planName={planName}
        amount={amount}
        currency={session.currency?.toUpperCase() || ''}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
} 