import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export type UserSubscriptionUpsert = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: Date | null;
  plan_name?: string;
  email?: string;
};

export async function upsertUserSubscription({
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  current_period_end,
  plan_name,
  email,
}: UserSubscriptionUpsert): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert([
        {
          user_id,
          stripe_customer_id,
          stripe_subscription_id,
          status,
          current_period_end,
          plan_name,
          email,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'user_id' });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getUserActiveSubscription(user_id: string) {
  // status: active, trialing, past_due 등 Stripe 기준 활성 상태
  // current_period_end가 미래여야 함
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .in('status', ['active', 'trialing', 'past_due'])
    .gt('current_period_end', new Date().toISOString())
    .single();
  if (error || !data) return null;
  return data;
} 