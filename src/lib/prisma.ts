/**
 * Prisma 클라이언트 싱글톤 패턴 구현
 * 개발 환경에서 Hot Reload로 인한 여러 인스턴스 생성 방지
 */

// PrismaClient 타입 정의
type PrismaClient = any;

// 글로벌 타입 확장
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 기존 prisma 인스턴스를 재사용하거나 새로 생성
let prismaClient: PrismaClient | undefined;

try {
  // Prisma 클라이언트를 동적으로 가져오기 시도
  // @ts-ignore
  const { PrismaClient } = require('@prisma/client');
  prismaClient = globalForPrisma.prisma ?? new PrismaClient();
} catch (error) {
  console.warn('Prisma 클라이언트를 초기화할 수 없습니다:', error);
  // 에러 발생 시 더미 클라이언트 제공
  prismaClient = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  };
}

export const prisma = prismaClient;

// 개발 환경에서는 전역 인스턴스 유지
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 