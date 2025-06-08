'use client';
import { useEffect } from 'react';
import { setAuthCookieFromLocalStorage } from '@/lib/auth';

export function AuthCookieSync() {
  useEffect(() => {
    setAuthCookieFromLocalStorage();
  }, []);
  return null;
} 