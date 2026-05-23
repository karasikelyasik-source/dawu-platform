'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = sessionStorage.getItem('dawu-user');

    if (!user) {
      router.push('/login');
      return;
    }

    router.push('/tables-dashboard');
  }, []);

  return null;
}