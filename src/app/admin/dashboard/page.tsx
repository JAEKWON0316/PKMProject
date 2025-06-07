import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/utils/dashboardStats";
import { AlertCircle, Users, Star, Zap } from "lucide-react";

export default async function AdminDashboardPage() {
  let stats: any = null;
  let error: string | null = null;
  try {
    stats = await getDashboardStats();
  } catch (e: any) {
    error = e?.message || "대시보드 통계 로드 실패";
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">관리자 대시보드</h1>
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-300">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Users className="h-5 w-5 text-cyan-400" /> 전체 유저
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">{stats?.totalUsers ?? '-'}</div>
            <Badge variant="outline" className="mt-2 bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">가입자</Badge>
          </CardContent>
        </Card>
        <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Star className="h-5 w-5 text-purple-400" /> 구독자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{stats?.totalSubscribers ?? '-'}</div>
            <Badge variant="outline" className="mt-2 bg-slate-800/50 text-purple-400 border-purple-500/50 text-xs">구독 활성</Badge>
          </CardContent>
        </Card>
        <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Zap className="h-5 w-5 text-yellow-400" /> 전체 대화 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats?.totalChats ?? '-'}</div>
            <Badge variant="outline" className="mt-2 bg-slate-800/50 text-yellow-400 border-yellow-500/50 text-xs">대화 기록</Badge>
          </CardContent>
        </Card>
      </div>
      {/* 추가 통계/그래프/최근 활동 등은 필요시 확장 */}
    </div>
  );
} 