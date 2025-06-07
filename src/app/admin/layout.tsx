import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSupabaseClient } from '@/lib/supabaseServer';
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/use-toast";
import { AuthProvider } from "@/contexts/AuthContext";

// 관리자 네비게이션 메뉴 정의
const adminNav = [
  { label: "대시보드", href: "/admin/dashboard" },
  { label: "회원 관리", href: "/admin/users" },
  { label: "구독 관리", href: "/admin/subscriptions" },
  { label: "Integrations", href: "/admin/integrations" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 서버에서 Supabase 세션 및 role 체크
  const supabase = getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  console.log('SSR user:', user);
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();
  console.log('SSR profile:', data, error);
  if (!user) redirect("/");
  if (error || !data || data.role !== "admin") redirect("/");

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="main-dark-theme min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <div className="flex min-h-screen">
                {/* 사이드바 */}
                <aside className="w-64 hidden md:block bg-gray-900 border-r border-gray-800 pt-20 md:pt-28 custom-scrollbar">
                  <nav className="flex flex-col gap-2 px-4">
                    {adminNav.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-purple-700/30 hover:text-purple-300 transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </aside>
                {/* 메인 컨텐츠 */}
                <main className="flex-1 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 md:pt-28 pt-20 custom-scrollbar">
                  {children}
                </main>
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 