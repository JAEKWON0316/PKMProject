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
  const isDark = pathname === '/' || pathname.startsWith('/dashboard') || pathname === '/terms' || pathname === '/privacy';
  const footerClass = isDark
    ? 'bg-gray-900 text-gray-400 dark:bg-black'
    : 'bg-gray-800 text-gray-400';

  return (
    <footer className={`w-full ${footerClass} py-6 px-4`}>
      <div className="max-w-6xl mx-auto flex flex-row items-center justify-between gap-4 whitespace-nowrap overflow-x-auto">
        <div className="flex items-center gap-2 text-sm min-w-fit">
          <Image src="/pkmlogo006.png" alt="PKM AI 로고" width={32} height={32} className="rounded-full bg-transparent" />
          <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent select-none">PKM AI</span>
          <span className="mx-2">|</span>
          <span className="text-xs">© 2025 PKM AI</span>
        </div>
        <div className="flex items-center gap-4 text-xs min-w-fit">
          {footerLinks.map(link => (
            <Link key={link.href} href={link.href} className="hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="text-xs text-gray-500 min-w-fit">
          PKM AI를 이용함으로써 약관 및 정책에 동의합니다.
        </div>
        <div className="flex items-center gap-3 min-w-fit ml-2">
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