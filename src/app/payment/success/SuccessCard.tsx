'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SuccessCard({ customerEmail, customerName, planName, amount, currency, startDate, endDate }: {
  customerEmail: string;
  customerName: string;
  planName: string;
  amount: string;
  currency?: string;
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2">결제가 완료되었습니다!</CardTitle>
        <div className="text-gray-300 text-base">구매해주셔서 감사합니다.<br />아래는 결제 내역입니다.</div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-800 rounded-lg p-4 text-left text-gray-200 space-y-2 mb-4 border border-gray-700">
          <div><span className="font-semibold text-gray-400">이름</span>: {customerName}</div>
          <div><span className="font-semibold text-gray-400">이메일</span>: {customerEmail}</div>
          <div><span className="font-semibold text-gray-400">구독 플랜</span>: {planName}</div>
          <div><span className="font-semibold text-gray-400">구독 시작일</span>: {startDate}</div>
          <div><span className="font-semibold text-gray-400">구독 만료일</span>: {endDate}</div>
          <div><span className="font-semibold text-gray-400">금액</span>: {amount} {currency}</div>
        </div>
        <div className="text-sm text-gray-400 text-center mb-2">5초 후 대시보드로 자동 이동합니다.</div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">홈으로</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 