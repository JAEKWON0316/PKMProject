"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CircleOff,
  Command,
  Cpu,
  Database,
  Download,
  Globe,
  HardDrive,
  Hexagon,
  LineChart,
  Lock,
  type LucideIcon,
  MessageSquare,
  Mic,
  Moon,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Star,
  Sun,
  Terminal,
  Wifi,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LoginModal } from "@/components/login-modal"

// AuthContext 및 통계 함수 import
import { useAuth } from "@/contexts/AuthContext"
import { getAllChatSessionsLightweight } from "@/utils/supabaseHandler"
import { getSupabaseClient } from "@/lib/supabase"
import { 
  calculateUserStats, 
  formatStatsForDashboard,
  getRecentActivity,
  getActivityTrend,
  type ChatSession,
  type UserStats 
} from "@/utils/dashboardStats"

interface DashboardData {
  sessions: Partial<ChatSession>[];
  userStats: UserStats;
  recentActivity: any[];
  activityTrend: any[];
  allSessions?: Partial<ChatSession>[];
}

export default function DashboardClient() {
  const { user, isAuthenticated, loading, profile } = useAuth()
  
  // 기존 UI 상태들 (모두 보존)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [systemStatus, setSystemStatus] = useState(85)
  const [cpuUsage, setCpuUsage] = useState(42)
  const [memoryUsage, setMemoryUsage] = useState(68)
  const [networkStatus, setNetworkStatus] = useState(92)
  const [securityLevel, setSecurityLevel] = useState(75)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  
  // 사용자 데이터 상태
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 로그인 모달 상태
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 사용자 데이터 로딩
  const fetchUserData = async () => {
    if (!user?.id || !profile) {
      setIsLoading(false)
      return
    }
    try {
      setError(null)
      // 관리자면 전체 대화, 아니면 본인 대화만 fetch
      const isAdmin = profile.role === 'admin';
      const result = await getAllChatSessionsLightweight(isAdmin ? null : user.id);
      // 전체 대화 수/목록
      const allSessions = result.sessions;
      // 본인 대화만 필터링
      const userSessions = isAdmin ? allSessions : allSessions.filter(session => session.user_id === user.id);
      const userStats = calculateUserStats(userSessions as any)
      const recentActivity = getRecentActivity(userSessions as any, 4)
      const activityTrend = getActivityTrend(userSessions as any)
      setData({
        sessions: userSessions as any,
        userStats,
        recentActivity,
        activityTrend,
        allSessions: isAdmin ? allSessions : undefined // 관리자만 전체 대화 목록 보관
      })
    } catch (err) {
      console.error('Dashboard 데이터 로딩 오류:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 새로고침 함수
  const handleRefresh = () => {
    setIsLoading(true)
    fetchUserData()
  }

  // 초기 데이터 로딩 및 사용자 변경 시 재로딩
  useEffect(() => {
    // AuthContext가 로딩 중이면 아무것도 하지 않음
    if (loading) {
      return
    }

    if (isAuthenticated && user?.id) {
      // 최소 2초 로딩 (기존 UI 경험 유지)
      const timer = setTimeout(() => {
        fetchUserData()
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      // 비인증 사용자는 즉시 로딩 완료
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000) // 좀 더 빠르게 처리
      return () => clearTimeout(timer)
    }
  }, [user?.id, isAuthenticated, loading]) // loading 종속성 추가

  // 시간 업데이트 (기존 로직 유지)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 동적 데이터 시뮬레이션 (기존 로직 유지)
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 30)
      setMemoryUsage(Math.floor(Math.random() * 20) + 60)
      setNetworkStatus(Math.floor(Math.random() * 15) + 80)
      setSystemStatus(Math.floor(Math.random() * 10) + 80)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // 파티클 효과 (기존 로직 유지)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 100

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * (canvas?.width || 0)
        this.y = Math.random() * (canvas?.height || 0)
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        const red = Math.floor(Math.random() * 30) + 150; // 150-180 범위의 빨간색
        const blue = Math.floor(Math.random() * 30) + 220; // 220-250 범위의 파란색
        this.color = `rgba(${red}, 10, ${blue}, ${Math.random() * 0.2 + 0.7})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (canvas && this.x > canvas.width) this.x = 0
        if (this.x < 0 && canvas) this.x = canvas.width
        if (canvas && this.y > canvas.height) this.y = 0
        if (this.y < 0 && canvas) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // 테마 토글
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // 시간 포맷팅 함수들
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Dashboard 통계를 위한 동적 데이터
  const dashboardStats = data ? formatStatsForDashboard(data.userStats) : null

  // 관리자용 전체 대화 수 MetricCard
  const isAdmin = profile?.role === 'admin';

  // AuthContext가 아직 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <div className={`${theme} min-h-screen main-dark-theme dashboard-purple-bg text-slate-100 relative overflow-hidden`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 purple-particles" />
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10"></div>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-r-purple-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
              <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
              <div className="absolute inset-8 border-4 border-l-green-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-4 text-purple-500 font-mono text-sm tracking-wider">AUTHENTICATION CHECK</div>
          </div>
        </div>
      </div>
    )
  }

  // 비인증 사용자를 위한 로그인 화면
  if (!isAuthenticated) {
    return (
      <>
        <div className={`${theme} min-h-screen main-dark-theme dashboard-purple-bg text-slate-100 relative overflow-hidden`}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 purple-particles" />
          <div className="absolute inset-0 bg-grid-white/[0.02] -z-10"></div>
          
          <div className="flex items-center justify-center min-h-screen">
            <Card className="bg-background/60 border-border/50 backdrop-blur-sm p-8 max-w-md mx-4">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <div className="absolute inset-0 bg-purple-600/50 blur-md rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-purple-500/40 blur-sm rounded-full"></div>
                    <Hexagon className="h-12 w-12 text-purple-400 relative z-10" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  PKM Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-300 mb-6">
                  개인화된 대시보드를 사용하려면 로그인이 필요합니다.
                </p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  로그인하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* 로그인 모달 */}
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
      </>
    )
  }

  return (
    <div className="bg-black min-h-screen w-full">
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 purple-particles" />

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10"></div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-r-purple-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
              <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
              <div className="absolute inset-8 border-4 border-l-green-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-4 text-purple-500 font-mono text-sm tracking-wider">PKM AI</div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 relative z-10 pt-20 md:pt-28">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-slate-700/50 mb-6">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-purple-600/50 blur-md rounded-full animate-pulse"></div>
              <div className="absolute inset-1 bg-purple-500/40 blur-sm rounded-full"></div>
              <Hexagon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 relative z-10" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              DASHBOARD
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-1 bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-700/50 backdrop-blur-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search systems..."
                className="bg-transparent border-none focus:outline-none text-sm w-40 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-100">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-pulse"></span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>알림</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="text-slate-400 hover:text-slate-100"
                    >
                      {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                <AvatarFallback className="bg-slate-700 text-purple-500">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="bg-background/60 border-border/50 backdrop-blur-sm h-full">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <NavItem icon={Command} label="Dashboard" active />
                  <NavItem icon={Activity} label="Diagnostics" />
                  <NavItem icon={Database} label="Data Center" />
                  <NavItem icon={Globe} label="Network" />
                  <NavItem icon={Shield} label="Security" />
                  <NavItem icon={Terminal} label="Console" />
                  <NavItem icon={MessageSquare} label="Communications" />
                  <NavItem icon={Settings} label="Settings" />
                </nav>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-2 font-mono">SYSTEM STATUS</div>
                  <div className="space-y-3">
                    <StatusItem label="Core Systems" value={systemStatus} color="cyan" />
                    <StatusItem label="Security" value={securityLevel} color="purple" />
                    <StatusItem label="Network" value={networkStatus} color="blue" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main dashboard */}
          <div className="col-span-12 md:col-span-9 lg:col-span-7">
            <div className="grid gap-6">
              {/* 사용자 통계 카드들 */}
              {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <MetricCard
                    title="총 대화 수"
                    value={dashboardStats.totalChats.value}
                    icon={MessageSquare}
                    trend="stable"
                    color="cyan"
                    detail={dashboardStats.totalChats.label}
                    showPercentage={false}
                  />
                  <MetricCard
                    title="활성 카테고리"
                    value={dashboardStats.totalCategories.value}
                    icon={Database}
                    trend="up"
                    color="purple"
                    detail={dashboardStats.totalCategories.label}
                    showPercentage={false}
                  />
                  <MetricCard
                    title="최근 활동"
                    value={dashboardStats.recentActivity.value}
                    icon={Activity}
                    trend="up"
                    color="blue"
                    detail={dashboardStats.recentActivity.label}
                    showPercentage={false}
                  />
                </div>
              )}

              {/* System overview */}
              <Card className="bg-background/60 border-border/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-100 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-cyan-500" />
                      System Overview
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse"></div>
                        LIVE
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400"
                        onClick={handleRefresh}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                      title="CPU Usage"
                      value={cpuUsage}
                      icon={Cpu}
                      trend="up"
                      color="cyan"
                      detail="3.8 GHz | 12 Cores"
                    />
                    <MetricCard
                      title="Memory"
                      value={memoryUsage}
                      icon={HardDrive}
                      trend="stable"
                      color="purple"
                      detail="16.4 GB / 24 GB"
                    />
                    <MetricCard
                      title="Network"
                      value={networkStatus}
                      icon={Wifi}
                      trend="down"
                      color="blue"
                      detail="1.2 GB/s | 42ms"
                    />
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="performance" className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-slate-800/50 p-1">
                          <TabsTrigger
                            value="performance"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                          >
                            Performance
                          </TabsTrigger>
                          <TabsTrigger
                            value="processes"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                          >
                            Processes
                          </TabsTrigger>
                          <TabsTrigger
                            value="storage"
                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                          >
                            Storage
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-1"></div>
                            CPU
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-cyan-500 mr-1"></div>
                            Memory
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                            Network
                          </div>
                        </div>
                      </div>

                      <TabsContent value="performance" className="mt-0">
                        <div className="h-64 w-full relative bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                          <PerformanceChart />
                          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-md px-3 py-2 border border-slate-700/50">
                            <div className="text-xs text-slate-400">System Load</div>
                            <div className="text-lg font-mono text-purple-400">{cpuUsage}%</div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="processes" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                          <div className="grid grid-cols-12 text-xs text-slate-400 p-3 border-b border-slate-700/50 bg-slate-800/50">
                            <div className="col-span-1">PID</div>
                            <div className="col-span-4">Process</div>
                            <div className="col-span-2">User</div>
                            <div className="col-span-2">CPU</div>
                            <div className="col-span-2">Memory</div>
                            <div className="col-span-1">Status</div>
                          </div>

                          <div className="divide-y divide-slate-700/30">
                            <ProcessRow
                              pid="1024"
                              name="system_core.exe"
                              user="SYSTEM"
                              cpu={12.4}
                              memory={345}
                              status="running"
                            />
                            <ProcessRow
                              pid="1842"
                              name="nexus_service.exe"
                              user="SYSTEM"
                              cpu={8.7}
                              memory={128}
                              status="running"
                            />
                            <ProcessRow
                              pid="2156"
                              name="security_monitor.exe"
                              user="ADMIN"
                              cpu={5.2}
                              memory={96}
                              status="running"
                            />
                            <ProcessRow
                              pid="3012"
                              name="network_manager.exe"
                              user="SYSTEM"
                              cpu={3.8}
                              memory={84}
                              status="running"
                            />
                            <ProcessRow
                              pid="4268"
                              name="user_interface.exe"
                              user="USER"
                              cpu={15.3}
                              memory={256}
                              status="running"
                            />
                            <ProcessRow
                              pid="5124"
                              name="data_analyzer.exe"
                              user="ADMIN"
                              cpu={22.1}
                              memory={512}
                              status="running"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="storage" className="mt-0">
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StorageItem name="System Drive (C:)" total={512} used={324} type="SSD" />
                            <StorageItem name="Data Drive (D:)" total={2048} used={1285} type="HDD" />
                            <StorageItem name="Backup Drive (E:)" total={4096} used={1865} type="HDD" />
                            <StorageItem name="External Drive (F:)" total={1024} used={210} type="SSD" />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Communications - 최근 대화 활동 */}
              <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center text-base">
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
                    최근 대화 활동
                  </CardTitle>
                  <Badge variant="outline" className="bg-slate-800/50 text-purple-400 border-purple-500/50">
                    {data?.recentActivity.length || 0}개 항목
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.recentActivity.length ? (
                      data.recentActivity.map((activity, index) => (
                        <RecentChatItem
                          key={activity.id}
                          sessionId={activity.sessionId}
                          title={activity.title}
                          category={activity.category}
                          time={new Date(activity.createdAt).toLocaleString('ko-KR')}
                          messageCount={activity.messageCount}
                          summary={activity.summary}
                          isFavorite={activity.isFavorite}
                          onFavoriteToggle={() => handleRefresh()}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>아직 대화가 없습니다</p>
                        <p className="text-sm mt-2">새로운 대화를 시작해보세요!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 관리자용 전체 대화 수 MetricCard */}
              {isAdmin && data?.allSessions && (
                <div className="mb-6">
                  <MetricCard
                    title="전체 대화 수"
                    value={data.allSessions.length}
                    icon={MessageSquare}
                    trend="stable"
                    color="cyan"
                    detail="모든 유저의 총 대화 수"
                    showPercentage={false}
                  />
                  {/* 전체 대화 목록 간단 리스트 */}
                  <div className="mt-4 bg-slate-800/60 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-2 text-purple-300">전체 대화 목록</h3>
                    <ul className="divide-y divide-slate-700 max-h-80 overflow-y-auto">
                      {data.allSessions.slice(0, 50).map(session => (
                        <li key={session.id} className="py-2 flex justify-between items-center">
                          <span className="truncate max-w-xs">{session.title || '제목 없음'}</span>
                          <span className="text-xs text-slate-400 ml-2">{session.user_id}</span>
                          <span className="text-xs text-slate-500 ml-2">{session.created_at ? new Date(session.created_at).toLocaleString() : ''}</span>
                        </li>
                      ))}
                    </ul>
                    {data.allSessions.length > 50 && (
                      <div className="text-xs text-slate-400 mt-2">(최대 50개만 표시)</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="grid gap-6">
              {/* System time */}
              <Card className="bg-background/60 border-border/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1 font-mono">SYSTEM TIME</div>
                      <div className="text-3xl font-mono text-purple-400 mb-1">{formatTime(currentTime)}</div>
                      <div className="text-sm text-slate-400">{formatDate(currentTime)}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Uptime</div>
                        <div className="text-sm font-mono text-slate-200">14d 06:42:18</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Time Zone</div>
                        <div className="text-sm font-mono text-slate-200">UTC+09:00</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionButton icon={Shield} label="Security Scan" />
                    <ActionButton icon={RefreshCw} label="Sync Data" />
                    <ActionButton icon={Download} label="Backup" />
                    <ActionButton icon={Terminal} label="Console" />
                  </div>
                </CardContent>
              </Card>

              {/* Resource allocation */}
              <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base">Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-slate-400">Processing Power</div>
                        <div className="text-xs text-cyan-400">42% allocated</div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: "42%" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-slate-400">Memory Allocation</div>
                        <div className="text-xs text-purple-400">68% allocated</div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: "68%" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-slate-400">Network Bandwidth</div>
                        <div className="text-xs text-blue-400">35% allocated</div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: "35%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-slate-400">Priority Level</div>
                        <div className="flex items-center">
                          <Slider defaultValue={[3]} max={5} step={1} className="w-24 mr-2" />
                          <span className="text-purple-400">3/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Environment controls */}
              <Card className="bg-background/60 border-border/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100 text-base">Environment Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Radio className="text-purple-500 mr-2 h-4 w-4" />
                        <Label className="text-sm text-slate-400">Power Management</Label>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Lock className="text-purple-500 mr-2 h-4 w-4" />
                        <Label className="text-sm text-slate-400">Security Protocol</Label>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Zap className="text-purple-500 mr-2 h-4 w-4" />
                        <Label className="text-sm text-slate-400">Power Saving Mode</Label>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CircleOff className="text-purple-500 mr-2 h-4 w-4" />
                        <Label className="text-sm text-slate-400">Auto Shutdown</Label>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for nav items
function NavItem({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start ${active ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:text-purple-400"}`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}

// Component for status items
function StatusItem({ label, value, color }: { label: string; value: number; color: string }) {
  const getColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500"
      case "green":
        return "from-green-500 to-emerald-500"
      case "blue":
        return "from-blue-500 to-indigo-500"
      case "purple":
        return "from-purple-500 to-pink-500"
      default:
        return "from-cyan-500 to-blue-500"
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-xs text-slate-400">{value}%</div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getColor()} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}

// Component for metric cards
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  detail,
  showPercentage = true,
}: {
  title: string
  value: number
  icon: LucideIcon
  trend: "up" | "down" | "stable"
  color: string
  detail: string
  showPercentage?: boolean
}) {
  const getColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
      case "green":
        return "from-green-500 to-emerald-500 border-green-500/30"
      case "blue":
        return "from-blue-500 to-indigo-500 border-blue-500/30"
      case "purple":
        return "from-purple-500 to-pink-500 border-purple-500/30"
      default:
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <BarChart3 className="h-4 w-4 text-amber-500" />
      case "down":
        return <BarChart3 className="h-4 w-4 rotate-180 text-green-500" />
      case "stable":
        return <LineChart className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg border ${getColor()} p-4 relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">{title}</div>
        <Icon className={`h-5 w-5 text-${color}-500`} />
      </div>
      <div className="text-2xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">
        {value}{showPercentage ? '%' : '개'}
      </div>
      <div className="text-xs text-slate-500">{detail}</div>
      <div className="absolute bottom-2 right-2 flex items-center">{getTrendIcon()}</div>
      <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-cyan-500 to-blue-500"></div>
    </div>
  )
}

// Performance chart component
function PerformanceChart() {
  return (
    <div className="h-full w-full flex items-end justify-between px-4 pt-4 pb-8 relative">
      {/* Y-axis labels */}
      <div className="absolute left-2 top-0 h-full flex flex-col justify-between py-4">
        <div className="text-xs text-slate-500">100%</div>
        <div className="text-xs text-slate-500">75%</div>
        <div className="text-xs text-slate-500">50%</div>
        <div className="text-xs text-slate-500">25%</div>
        <div className="text-xs text-slate-500">0%</div>
      </div>

      {/* X-axis grid lines */}
      <div className="absolute left-0 right-0 top-0 h-full flex flex-col justify-between py-4 px-10">
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
        <div className="border-b border-slate-700/30 w-full"></div>
      </div>

      {/* Chart bars */}
      <div className="flex-1 h-full flex items-end justify-between px-2 z-10">
        {Array.from({ length: 24 }).map((_, i) => {
          const cpuHeight = Math.floor(Math.random() * 60) + 20
          const memHeight = Math.floor(Math.random() * 40) + 40
          const netHeight = Math.floor(Math.random() * 30) + 30

          return (
            <div key={i} className="flex space-x-0.5">
              <div
                className="w-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm"
                style={{ height: `${cpuHeight}%` }}
              ></div>
              <div
                className="w-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm"
                style={{ height: `${memHeight}%` }}
              ></div>
              <div
                className="w-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                style={{ height: `${netHeight}%` }}
              ></div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10">
        <div className="text-xs text-slate-500">00:00</div>
        <div className="text-xs text-slate-500">06:00</div>
        <div className="text-xs text-slate-500">12:00</div>
        <div className="text-xs text-slate-500">18:00</div>
        <div className="text-xs text-slate-500">24:00</div>
      </div>
    </div>
  )
}

// Process row component
function ProcessRow({
  pid,
  name,
  user,
  cpu,
  memory,
  status,
}: {
  pid: string
  name: string
  user: string
  cpu: number
  memory: number
  status: string
}) {
  return (
    <div className="grid grid-cols-12 py-2 px-3 text-sm hover:bg-slate-800/50">
      <div className="col-span-1 text-slate-500">{pid}</div>
      <div className="col-span-4 text-slate-300">{name}</div>
      <div className="col-span-2 text-slate-400">{user}</div>
      <div className="col-span-2 text-purple-400">{cpu}%</div>
      <div className="col-span-2 text-cyan-400">{memory} MB</div>
      <div className="col-span-1">
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
          {status}
        </Badge>
      </div>
    </div>
  )
}

// Storage item component
function StorageItem({
  name,
  total,
  used,
  type,
}: {
  name: string
  total: number
  used: number
  type: string
}) {
  const percentage = Math.round((used / total) * 100)

  return (
    <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-300">{name}</div>
        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
          {type}
        </Badge>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-500">
            {used} GB / {total} GB
          </div>
          <div className="text-xs text-slate-400">{percentage}%</div>
        </div>
        <Progress value={percentage} className="h-1.5 bg-slate-700">
          <div
            className={`h-full rounded-full ${
              percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-cyan-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </Progress>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-slate-500">Free: {total - used} GB</div>
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-slate-400 hover:text-slate-100">
          Details
        </Button>
      </div>
    </div>
  )
}

// Alert item component
function AlertItem({
  title,
  time,
  description,
  type,
}: {
  title: string
  time: string
  description: string
  type: "info" | "warning" | "error" | "success" | "update"
}) {
  const getTypeStyles = () => {
    switch (type) {
      case "info":
        return { icon: Info, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" }
      case "warning":
        return { icon: AlertCircle, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" }
      case "error":
        return { icon: AlertCircle, color: "text-red-500 bg-red-500/10 border-red-500/30" }
      case "success":
        return { icon: Check, color: "text-green-500 bg-green-500/10 border-green-500/30" }
      case "update":
        return { icon: Download, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" }
      default:
        return { icon: Info, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" }
    }
  }

  const { icon: Icon, color } = getTypeStyles()

  return (
    <div className="flex items-start space-x-3">
      <div className={`mt-0.5 p-1 rounded-full ${color.split(" ")[1]} ${color.split(" ")[2]}`}>
        <Icon className={`h-3 w-3 ${color.split(" ")[0]}`} />
      </div>
      <div>
        <div className="flex items-center">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          <div className="ml-2 text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </div>
  )
}

// Communication item component
function CommunicationItem({
  sender,
  time,
  message,
  avatar,
  unread,
}: {
  sender: string
  time: string
  message: string
  avatar: string
  unread?: boolean
}) {
  return (
    <div className={`flex space-x-3 p-2 rounded-md ${unread ? "bg-slate-800/50 border border-slate-700/50" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar} alt={sender} />
        <AvatarFallback className="bg-slate-700 text-purple-500">{sender.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-200">{sender}</div>
          <div className="text-xs text-slate-500">{time}</div>
        </div>
        <div className="text-xs text-slate-400 mt-1">{message}</div>
      </div>
      {unread && (
        <div className="flex-shrink-0 self-center">
          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
        </div>
      )}
    </div>
  )
}

// Action button component
function ActionButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-auto py-3 px-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center space-y-1 w-full"
    >
      <Icon className="h-5 w-5 text-purple-500" />
      <span className="text-xs">{label}</span>
    </Button>
  )
}

// Add missing imports
function Info(props: React.ComponentProps<typeof AlertCircle>) {
  return <AlertCircle {...props} />
}

function Check(props: React.ComponentProps<typeof Shield>) {
  return <Shield {...props} />
}

// Recent chat item component
function RecentChatItem({
  sessionId,
  title,
  category,
  time,
  messageCount,
  summary,
  isFavorite = false,
  onFavoriteToggle,
}: {
  sessionId?: string
  title: string
  category: string
  time: string
  messageCount: number
  summary?: string
  isFavorite?: boolean
  onFavoriteToggle?: () => void
}) {
  const { user, isAuthenticated } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [favoriteState, setFavoriteState] = useState(isFavorite)

  // 즐겨찾기 토글 핸들러
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    // 이벤트 전파 완전 차단
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    if (!sessionId || isUpdating) {
      return
    }

    const newFavoriteState = !favoriteState
    setIsUpdating(true)
    
    // Optimistic update
    setFavoriteState(newFavoriteState)
    
    try {
      // Supabase 클라이언트를 직접 사용하여 업데이트
      const supabase = getSupabaseClient()
      
      if (newFavoriteState) {
        // 즐겨찾기 추가
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user?.id,
            session_id: sessionId
          })

        if (error && error.code !== '23505') { // unique constraint violation이 아닌 경우만 에러로 처리
          throw new Error(`즐겨찾기 추가 실패: ${error.message}`)
        }
      } else {
        // 즐겨찾기 제거
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('session_id', sessionId)

        if (error) {
          throw new Error(`즐겨찾기 제거 실패: ${error.message}`)
        }
      }
      
      // 부모 컴포넌트에 데이터 새로고침 알림
      onFavoriteToggle?.()
      
    } catch (error) {
      console.error('즐겨찾기 토글 에러:', error)
      // 실패 시 상태 롤백
      setFavoriteState(!newFavoriteState)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-slate-200 mb-1 line-clamp-1">
            {title || "제목 없음"}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Badge variant="outline" className="bg-slate-700/50 text-purple-400 border-purple-500/30 text-xs">
              {category || "일반"}
            </Badge>
            <span>•</span>
            <span>{messageCount}개 메시지</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <div className="text-xs text-slate-500">
            {time}
          </div>
          {/* 즐겨찾기 버튼 */}
          {sessionId && (
            <button
              onClick={handleFavoriteToggle}
              disabled={isUpdating}
              className={`p-1 rounded-sm transition-all duration-200 hover:scale-125 hover:bg-slate-600/50 cursor-pointer ${
                isUpdating ? 'animate-pulse' : ''
              }`}
              title={favoriteState ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              style={{ zIndex: 10 }}
            >
              <Star 
                className={`w-4 h-4 transition-colors ${
                  favoriteState 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-gray-400 hover:text-amber-400'
                }`} 
              />
            </button>
          )}
        </div>
      </div>
      {summary && (
        <p className="text-xs text-slate-400 line-clamp-2 mt-2">
          {summary}
        </p>
      )}
    </div>
  )
} 