'use client'

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// 싱글톤 패턴: 컴포넌트 외부에서 한 번만 생성
const supabase = createPagesBrowserClient();

export default function SupabaseClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
} 