import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function fetchUsers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/users`, { cache: 'no-store' });
  const json = await res.json();
  return json.data || [];
}

export default async function AdminUsersPage() {
  const users = await fetchUsers();
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">회원 관리</h1>
      <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>전체 회원 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">이메일</th>
                <th className="text-left">이름</th>
                <th className="text-left">가입일</th>
                <th className="text-left">권한</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-border/30">
                  <td>{user.email}</td>
                  <td>{user.full_name || '-'}</td>
                  <td>{user.created_at?.slice(0, 10) || '-'}</td>
                  <td>
                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                      {user.role}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 