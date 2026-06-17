'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(token ? '/dashboard/' : '/login/');
    }
  }, [token, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Yuklanmoqda...</p>
    </div>
  );
}
