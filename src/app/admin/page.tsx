import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const token = cookies().get('sb-access-token')?.value;
  if (!token) {
    // 토큰이 없으면 바로 메인페이지로 리다이렉트
    redirect('/');
  }
  try {
    await requireAdmin(token);
    // 관리자만 볼 수 있는 클라이언트 컴포넌트 렌더링
    return <AdminClient />;
  } catch (e) {
    // 권한 없음: 메인페이지로 리다이렉트
    redirect('/');
  }
} 