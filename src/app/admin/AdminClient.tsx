"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, CreditCard, Edit, Trash2, RefreshCw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminClient() {
  // 유저/구독 데이터
  const { data: userData, mutate: mutateUsers, isLoading: loadingUsers } = useSWR("/api/admin/users", fetcher);
  const { data: subData, mutate: mutateSubs, isLoading: loadingSubs } = useSWR("/api/admin/subscriptions", fetcher);

  // 상세 Drawer/Modal 상태
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [userEdit, setUserEdit] = useState<any | null>(null);
  const [subEdit, setSubEdit] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 유저/구독 새로고침
  const handleRefresh = () => {
    mutateUsers();
    mutateSubs();
  };

  // 유저/구독 상세 열기 시 입력값 초기화
  const openUser = (user: any, edit = false) => {
    setSelectedUser(user);
    setEditMode(edit);
    setUserEdit(user ? { ...user } : null);
    setMessage(null);
  };
  const openSub = (sub: any, edit = false) => {
    setSelectedSub(sub);
    setEditMode(edit);
    setSubEdit(sub ? { ...sub } : null);
    setMessage(null);
  };

  // 유저 저장
  const handleUserSave = async () => {
    if (!userEdit) return;
    setLoadingAction(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userEdit)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('저장 성공!');
        mutateUsers();
        setTimeout(() => { setSelectedUser(null); }, 700);
      } else {
        setMessage(data.error || '저장 실패');
      }
    } catch (e) {
      setMessage('저장 중 오류');
    } finally {
      setLoadingAction(false);
    }
  };
  // 유저 삭제
  const handleUserDelete = async () => {
    if (!selectedUser) return;
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    setLoadingAction(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('삭제 성공!');
        mutateUsers();
        setTimeout(() => { setSelectedUser(null); }, 700);
      } else {
        setMessage(data.error || '삭제 실패');
      }
    } catch (e) {
      setMessage('삭제 중 오류');
    } finally {
      setLoadingAction(false);
    }
  };
  // 구독 저장
  const handleSubSave = async () => {
    if (!subEdit) return;
    setLoadingAction(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subEdit)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('저장 성공!');
        mutateSubs();
        setTimeout(() => { setSelectedSub(null); }, 700);
      } else {
        setMessage(data.error || '저장 실패');
      }
    } catch (e) {
      setMessage('저장 중 오류');
    } finally {
      setLoadingAction(false);
    }
  };
  // 구독 삭제
  const handleSubDelete = async () => {
    if (!selectedSub) return;
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    setLoadingAction(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSub.id })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('삭제 성공!');
        mutateSubs();
        setTimeout(() => { setSelectedSub(null); }, 700);
      } else {
        setMessage(data.error || '삭제 실패');
      }
    } catch (e) {
      setMessage('삭제 중 오류');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="container mx-auto py-10 bg-black min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">관리자 대시보드</h1>
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> 새로고침
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 유저 관리 */}
        <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-300">
              <User className="w-5 h-5" /> 전체 유저 ({userData?.users?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="py-2 px-2 text-left">이름</th>
                    <th className="py-2 px-2 text-left">이메일</th>
                    <th className="py-2 px-2 text-left">권한</th>
                    <th className="py-2 px-2 text-left">가입일</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {userData?.users?.map((user: any) => (
                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={() => { openUser(user); }}>
                      <td className="py-2 px-2 font-medium">{user.full_name || "-"}</td>
                      <td className="py-2 px-2">{user.email}</td>
                      <td className="py-2 px-2">
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role || 'user'}</Badge>
                      </td>
                      <td className="py-2 px-2">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-2">
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openUser(user, true); }}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openUser(user); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingUsers && <div className="text-center text-slate-400 py-4">로딩 중...</div>}
            </div>
          </CardContent>
        </Card>
        {/* 구독 관리 */}
        <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-300">
              <CreditCard className="w-5 h-5" /> 전체 구독 ({subData?.subscriptions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="py-2 px-2 text-left">유저ID</th>
                    <th className="py-2 px-2 text-left">플랜</th>
                    <th className="py-2 px-2 text-left">상태</th>
                    <th className="py-2 px-2 text-left min-w-[120px]">만료일</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {subData?.subscriptions?.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={() => { openSub(sub); }}>
                      <td className="py-2 px-2 font-mono">{sub.user_id}</td>
                      <td className="py-2 px-2">{sub.plan_name || '-'}</td>
                      <td className="py-2 px-2">
                        <Badge variant={sub.status === 'active' ? 'default' : 'outline'}>{sub.status}</Badge>
                      </td>
                      <td className="py-2 px-2 min-w-[120px]">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openSub(sub, true); }}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openSub(sub); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingSubs && <div className="text-center text-slate-400 py-4">로딩 중...</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 유저 상세/수정/삭제 Drawer/Modal */}
      <Dialog open={!!selectedUser} onOpenChange={open => { if (!open) setSelectedUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>유저 정보 {editMode ? '수정' : '상세'}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <Input disabled={!editMode || loadingAction} value={userEdit?.full_name || ''} onChange={e => setUserEdit((u: any) => ({ ...u, full_name: e.target.value }))} placeholder="이름" />
              <Input disabled={!editMode || loadingAction} value={userEdit?.email || ''} onChange={e => setUserEdit((u: any) => ({ ...u, email: e.target.value }))} placeholder="이메일" />
              <Input disabled={!editMode || loadingAction} value={userEdit?.role || ''} onChange={e => setUserEdit((u: any) => ({ ...u, role: e.target.value }))} placeholder="권한(admin/user)" />
            </div>
          )}
          {message && <div className="text-center text-sm py-2 text-purple-400">{message}</div>}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedUser(null)} disabled={loadingAction}>닫기</Button>
            {editMode ? (
              <Button variant="default" onClick={handleUserSave} disabled={loadingAction}>{loadingAction ? '저장 중...' : '저장'}</Button>
            ) : (
              <Button variant="destructive" onClick={handleUserDelete} disabled={loadingAction}>{loadingAction ? '삭제 중...' : '삭제'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 구독 상세/수정/삭제 Drawer/Modal */}
      <Dialog open={!!selectedSub} onOpenChange={open => { if (!open) setSelectedSub(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구독 정보 {editMode ? '수정' : '상세'}</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-3">
              <Input disabled={!editMode || loadingAction} value={subEdit?.plan_name || ''} onChange={e => setSubEdit((s: any) => ({ ...s, plan_name: e.target.value }))} placeholder="플랜명" />
              <Input disabled={!editMode || loadingAction} value={subEdit?.status || ''} onChange={e => setSubEdit((s: any) => ({ ...s, status: e.target.value }))} placeholder="상태(active/canceled)" />
              <Input disabled={!editMode || loadingAction} value={subEdit?.current_period_end || ''} onChange={e => setSubEdit((s: any) => ({ ...s, current_period_end: e.target.value }))} placeholder="만료일(YYYY-MM-DD)" />
            </div>
          )}
          {message && <div className="text-center text-sm py-2 text-cyan-400">{message}</div>}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedSub(null)} disabled={loadingAction}>닫기</Button>
            {editMode ? (
              <Button variant="default" onClick={handleSubSave} disabled={loadingAction}>{loadingAction ? '저장 중...' : '저장'}</Button>
            ) : (
              <Button variant="destructive" onClick={handleSubDelete} disabled={loadingAction}>{loadingAction ? '삭제 중...' : '삭제'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 