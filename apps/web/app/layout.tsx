'use client';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const interval = setInterval(async () => {
      const sessionId = sessionStorage.getItem('dawu-session-id');

      if (!sessionId) return;

      try {
        const res = await fetch(
          `http://31.57.201.45:3000/admin-sessions/${sessionId}`
        );

        if (!res.ok) return;

        const session = await res.json();

        if (!session || session.online === false) {
          sessionStorage.removeItem('dawu-user');
          sessionStorage.removeItem('dawu-session-id');

          alert('You were kicked from the system');

          window.location.href = '/login';
        }
      } catch (e) {
        console.log(e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}