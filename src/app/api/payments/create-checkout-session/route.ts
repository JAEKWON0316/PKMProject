import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { PRODUCTS } from '@/utils/stripeProducts';
import { getUserActiveSubscription } from '@/utils/supabase/stripeHandlers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { productId, userId } = await req.json();
    const product = Object.values(PRODUCTS).find(p => p.id === productId);
    if (!product || !product.priceId) {
      return Response.json({ success: false, error: '유효하지 않은 상품입니다.' }, { status: 400 });
    }

    // ✅ 이미 구독 중인지 확인
    if (userId) {
      const activeSub = await getUserActiveSubscription(userId);
      if (activeSub) {
        return Response.json({ success: false, error: '이미 구독 중입니다. 구독 관리에서 확인하세요.' }, { status: 400 });
      }
    }

    // 1. userId로 Stripe Customer 생성 (metadata에 user_id 포함)
    const customer = await stripe.customers.create({
      metadata: userId ? { user_id: userId } : undefined,
      // email: userEmail, // 필요시 추가
    });

    // 2. Checkout 세션 생성 시 metadata, subscription_data.metadata에 user_id 포함
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      customer: customer.id,
      metadata: userId ? { user_id: userId } : undefined,
      subscription_data: userId ? { metadata: { user_id: userId } } : undefined,
    });

    return Response.json({ success: true, url: session.url });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message || '결제 세션 생성 오류' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return Response.json({ success: false, error: 'userId is required' }, { status: 400 });
  }
  const sub = await getUserActiveSubscription(userId);
  return Response.json({ success: true, subscription: sub });
} 