export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { upsertUserSubscription } from '@/utils/supabase/stripeHandlers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest): Promise<Response> {
  const sig = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) {
    return Response.json({ success: false, error: 'Missing Stripe webhook secret or signature' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return Response.json({ success: false, error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    let session = event.data.object as Stripe.Checkout.Session;
    // Webhook payload의 session에는 line_items, subscription이 expand되어 있지 않을 수 있으므로, session.id로 Stripe API에서 다시 조회
    session = await stripe.checkout.sessions.retrieve(session.id as string, {
      expand: ['line_items.data.price.product', 'subscription'],
    });
    // 1. session.metadata.user_id
    let user_id = session.metadata?.user_id;

    // 2. subscription.metadata.user_id
    let subscription: Stripe.Subscription | null = null;
    let currentPeriodEnd: Date | null = null;
    const subscriptionObj = session.subscription;
    if (subscriptionObj && typeof subscriptionObj === 'object') {
      subscription = subscriptionObj as Stripe.Subscription;
      if (!user_id && subscription.metadata?.user_id) {
        user_id = subscription.metadata.user_id;
      }
      // Stripe API 2025+ 호환: current_period_end는 subscription.items.data[0].current_period_end에서 추출
      if (Array.isArray((subscription as any).items?.data) && (subscription as any).items.data.length > 0 && (subscription as any).items.data[0].current_period_end) {
        currentPeriodEnd = new Date((subscription as any).items.data[0].current_period_end * 1000);
      } else if ((subscription as any).current_period_end) {
        // 구버전 Stripe API 호환
        currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      }
    } else if (typeof subscriptionObj === 'string') {
      // 혹시 string이면 별도 조회
      const subscriptionRes = await stripe.subscriptions.retrieve(subscriptionObj, { expand: ['items'] });
      subscription = subscriptionRes as Stripe.Subscription;
      if (!user_id && subscription.metadata?.user_id) {
        user_id = subscription.metadata.user_id;
      }
      if (Array.isArray((subscription as any).items?.data) && (subscription as any).items.data.length > 0 && (subscription as any).items.data[0].current_period_end) {
        currentPeriodEnd = new Date((subscription as any).items.data[0].current_period_end * 1000);
      } else if ((subscription as any).current_period_end) {
        currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      }
    }

    // 3. customer.metadata.user_id
    const customerRes = await stripe.customers.retrieve(session.customer as string);
    if ('deleted' in customerRes && customerRes.deleted) {
      return Response.json({ success: false, error: 'Customer was deleted' }, { status: 400 });
    }
    const customer = customerRes as Stripe.Customer;
    if (!user_id && customer.metadata?.user_id) {
      user_id = customer.metadata.user_id;
    }

    if (!user_id) {
      return Response.json({ success: false, error: 'No user_id in any Stripe metadata' }, { status: 400 });
    }

    // plan_name robust하게 추출
    let plan_name = '';
    const lineItems = (session as any).line_items?.data;
    if (lineItems && lineItems.length > 0) {
      const price = lineItems[0].price;
      if (price && price.product && typeof price.product === 'object' && 'name' in price.product) {
        plan_name = price.product.name;
      }
    }
    const { error } = await upsertUserSubscription({
      user_id,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription?.id ?? null,
      status: subscription?.status ?? 'active',
      current_period_end: currentPeriodEnd,
      plan_name,
      email: customer.email || undefined,
    });
    if (error) {
      return Response.json({
        success: false,
        error:
          typeof error === 'string'
            ? error
            : (typeof error === 'object' && error && 'message' in error)
            ? (error as any).message
            : 'Supabase upsert error',
      }, { status: 500 });
    }
    return Response.json({ success: true });
  }

  // 기타 이벤트 무시
  return Response.json({ success: true, ignored: true });
} 
