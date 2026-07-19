import type { Metadata } from 'next';
import {
  Geist,
  Geist_Mono,
} from 'next/font/google';

import { AccountProvider } from '../components/account/AccountProvider';
import { RestaurantSettingsProvider } from '../components/restaurant-settings/RestaurantSettingsProvider';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'DaWu Sushi Fusion',
    template: '%s | DaWu Sushi Fusion',
  },
  description:
    'DaWu Sushi Fusion in Beverwijk. Sushi, grill, all you can eat, takeaway and online reservations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AccountProvider>
          <RestaurantSettingsProvider>
            {children}
          </RestaurantSettingsProvider>
        </AccountProvider>
      </body>
    </html>
  );
}