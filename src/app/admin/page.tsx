import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function AdminPage() {
  // SSR-safe Supabase 클라이언트 생성 (쿠키 기반)
  const supabase = createServerComponentClient({ cookies });

  // 1. 세션 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login'); // 로그인 안 했으면 로그인 페이지로

  // 2. 프로필에서 role 확인
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    redirect('/'); // 권한 없으면 메인으로
  }

  // 3. 권한 통과 시 관리자 페이지 렌더링
  return (
    <div>
      <h1>관리자 페이지</h1>
      {/* 관리자 UI/컴포넌트 */}
    </div>
  );
} 