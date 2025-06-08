import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { PRODUCTS } from '@/utils/stripeProducts';
import { getUserActiveSubscription } from '@/utils/supabase/stripeHandlers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { productId, userId, email } = await req.json();
    const product = Object.values(PRODUCTS).find(p => p.id === productId);
    if (!product || !product.priceId) {
      return Response.json({ success: false, error: '유효하지 않은 상품입니다.' }, { status: 400 });
    }

    // ✅ Supabase에서 email 기준 active 구독 체크
    if (email) {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('email', email)
        .in('status', ['active', 'trialing', 'past_due'])
        .gt('current_period_end', new Date().toISOString())
        .single();
      if (existing) {
        return Response.json({ success: false, error: '이미 해당 이메일로 구독 중입니다.' }, { status: 400 });
      }
    }

    // ✅ userId 기준 active 구독 체크(기존 로직)
    if (userId) {
      const activeSub = await getUserActiveSubscription(userId);
      if (activeSub) {
        return Response.json({ success: false, error: '이미 구독 중입니다. 구독 관리에서 확인하세요.' }, { status: 400 });
      }
    }

    // ✅ Stripe에서 email로 Customer 검색 후 있으면 재사용, 없으면 새로 생성
    let customerId: string | null = null;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: userId ? { user_id: userId } : undefined,
      });
      customerId = customer.id;
    }

    // Checkout 세션 생성
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/payment/cancel`,
      customer: customerId,
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