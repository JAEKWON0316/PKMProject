import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 여러 클래스 이름을 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 사용하여 클래스 이름 충돌을 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 