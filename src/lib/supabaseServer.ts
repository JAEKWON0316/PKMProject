import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function getServerSupabaseClient() {
  return createServerComponentClient({ cookies });
} 