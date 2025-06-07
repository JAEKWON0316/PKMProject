'use client';
import SupabaseClientProvider from './SupabaseClientProvider';

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return <SupabaseClientProvider>{children}</SupabaseClientProvider>;
} 