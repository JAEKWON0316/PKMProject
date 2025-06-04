import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/use-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import Navbar from "@/components/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "PKM AI - AI 지식관리 플랫폼",
  description: "PKM AI와 함께 더 스마트하게 대화하고, 지식을 관리하세요. AI 기반 개인 지식 관리 시스템으로 대화를 저장하고 검색할 수 있습니다.",
  keywords: ["PKM", "AI", "지식관리", "ChatGPT", "대화저장", "RAG", "인공지능"],
  authors: [{ name: "PKM AI Team" }],
  creator: "PKM AI",
  publisher: "PKM AI",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/pkmlogo006.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: { url: "/pkmlogo006.png", sizes: "192x192", type: "image/png" },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://pkm-project-jaekwon0316s-projects.vercel.app/",
    title: "PKM AI - AI 지식관리 플랫폼",
    description: "PKM AI와 함께 더 스마트하게 대화하고, 지식을 관리하세요. AI 기반 개인 지식 관리 시스템으로 대화를 저장하고 검색할 수 있습니다.",
    siteName: "PKM AI",
    images: [
      {
        url: "https://pkm-project-jaekwon0316s-projects.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "PKM AI - AI 지식관리 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PKM AI - AI 지식관리 플랫폼",
    description: "PKM AI와 함께 더 스마트하게 대화하고, 지식을 관리하세요.",
    images: ["https://pkm-project-jaekwon0316s-projects.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // 실제 구글 검증 코드로 교체 필요
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 