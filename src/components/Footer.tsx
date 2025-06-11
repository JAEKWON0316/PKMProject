'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { usePathname } from 'next/navigation';

const footerLinks = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
];

const snsLinks = [
  { href: 'https://github.com/JAEKWON0316', label: 'GitHub', icon: <FaGithub size={18} /> },
  { href: 'https://www.instagram.com/jack1zz_', label: 'Instagram', icon: <FaInstagram size={18} /> },
  { href: 'https://www.linkedin.com/in/재권-이-23bbb036a', label: 'LinkedIn', icon: <FaLinkedin size={18} /> },
];

export default function Footer() {
  const pathname = usePathname();
  const isDark = pathname === '/' || pathname.startsWith('/dashboard') || pathname === '/terms' || pathname === '/privacy' || pathname === '/admin';
  const footerClass = isDark
    ? 'bg-gray-900 text-gray-400 dark:bg-black'
    : 'bg-gray-800 text-gray-400';

  return (
    <footer className={`w-full ${footerClass} py-6 px-4`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 좌: 로고 */}
        <div className="flex items-center gap-2 text-sm min-w-fit mb-2 md:mb-0">
          <Image src="/pkmlogo006.png" alt="PKM AI 로고" width={32} height={32} className="rounded-full bg-transparent" />
          <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent select-none">PKM AI</span>
          <span className="mx-2 hidden md:inline">|</span>
          <span className="text-xs hidden md:inline">© 2025 PKM AI</span>
        </div>
        {/* 중앙: 약관/정책 + 안내문구 */}
        <div className="flex flex-col items-center w-full md:w-auto">
          <div className="flex flex-row items-center justify-center gap-4 text-xs">
            <Link href="/terms" className="hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition-colors">
              이용약관
            </Link>
            <span className="text-gray-500">|</span>
            <Link href="/privacy" className="hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition-colors">
              개인정보처리방침
            </Link>
          </div>
          <div className="mt-2 text-xs text-center text-gray-500 px-2 break-keep">
            PKM AI를 이용함으로써 약관 및 정책에 동의합니다.
          </div>
        </div>
        {/* 우: SNS */}
        <div className="flex items-center gap-3 min-w-fit ml-0 md:ml-2 mt-2 md:mt-0">
          {snsLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="text-gray-400 hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
} 