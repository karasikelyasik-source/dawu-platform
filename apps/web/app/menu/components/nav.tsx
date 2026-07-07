'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Settings,
  TableProperties,
  Menu,
  Package,
  ScrollText,
  Printer,
  HandCoins,
  BarChart3,
  MonitorCog,
  Keyboard,
  QrCode,
  LogOut,
  ShoppingBag,
  CalendarDays,
} from 'lucide-react';
const navItems = [
  { href: '/', label: 'Tables', icon: TableProperties },
  { href: '/take-away', label: 'Take Away', icon: ShoppingBag },
  { href: '/menu', label: 'Menu', icon: Menu },
  { href: '/packages', label: 'Packages', icon: Package },
  { href: '/logs', label: 'Logs', icon: ScrollText },
  { href: '/printers', label: 'Printers', icon: Printer },
  { href: '/tips', label: 'Tips', icon: HandCoins },
  { href: '/revenue', label: 'Revenue', icon: BarChart3 },
  { href: '/reservations', label: 'Reservations', icon: CalendarDays },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  async function logout() {
    const sessionId = sessionStorage.getItem('dawu-session-id');

    if (sessionId) {
      await fetch(`http://31.57.201.45:3000/admin-sessions/${sessionId}/logout`, {
        method: 'PATCH',
      }).catch(() => null);
    }

    sessionStorage.removeItem('dawu-user');
    sessionStorage.removeItem('dawu-session-id');

    window.location.href = '/login';
  }

  function isActive(href: string) {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/tables');
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex max-w-full gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-zinc-950/70 p-2 shadow-2xl backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={`group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300 ${
                active
                  ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'border border-white/5 bg-white/[0.03] text-zinc-300 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 transition group-hover:opacity-100" />
              <Icon size={18} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </a>
          );
        })}
      </div>

      <div className="relative flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 font-black transition-all duration-300 ${
            open
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/10'
              : 'border-white/10 bg-zinc-950/80 text-zinc-300 hover:bg-white/[0.08] hover:text-white'
          }`}
        >
          <Settings size={20} />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
            <div className="px-4 py-3">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
                System
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                DaWu POS settings
              </div>
            </div>

            <a
              href="/sessions"
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <MonitorCog size={18} />
                Sessions
              </span>
              <span className="text-xs text-zinc-500">CTRL+1</span>
            </a>

            <a
              href="/qr-codes"
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <QrCode size={18} />
                QR Codes
              </span>
              <span className="text-xs text-zinc-500">QR</span>
            </a>

            <a
              href="/hotkeys"
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Keyboard size={18} />
                Hotkeys
              </span>
              <span className="text-xs text-zinc-500">CTRL+H</span>
            </a>

            <div className="my-2 h-px bg-white/10" />

            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}