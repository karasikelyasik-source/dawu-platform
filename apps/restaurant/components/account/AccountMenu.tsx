'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  Customer,
  useAccount,
} from './AccountProvider';

type Props = {
  customer: Customer;
  onClose: () => void;
};

export default function AccountMenu({
  customer,
  onClose,
}: Props) {
  const { logout } = useAccount();
  const [loggingOut, setLoggingOut] = useState(false);

  const hasAdminAccess =
    customer.role === 'ADMIN' ||
    customer.role === 'OWNER';

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      onClose();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close account menu"
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default bg-transparent"
      />

      <div className="absolute right-0 top-16 z-[80] w-[320px] overflow-hidden rounded-[26px] border border-white/10 bg-[#0d0b0a] shadow-2xl shadow-black/60">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-300 text-lg font-black text-black">
              {customer.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black text-white">
                {customer.name}
              </p>

              <p className="truncate text-sm text-zinc-500">
                {customer.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-2">
          <MenuLink
            href="/account"
            title="My Account"
            description="Profile and settings"
            onClick={onClose}
          />

          <MenuLink
            href="/account/reservations"
            title="My Reservations"
            description="Upcoming and previous bookings"
            onClick={onClose}
          />

          <MenuLink
            href="/account/orders"
            title="Order History"
            description="Restaurant and takeaway orders"
            onClick={onClose}
          />

          <MenuLink
            href="/account/deliveries"
            title="Delivery History"
            description="Delivery orders and status"
            onClick={onClose}
          />

          {hasAdminAccess && (
            <>
              <div className="my-2 border-t border-white/10" />

              <MenuLink
                href="/admin"
                title="Admins"
                description="Customer administration panel"
                onClick={onClose}
              />

              <MenuLink
                href="/reservations/scanner"
                title="Scanner"
                description="Scan reservation QR codes"
                onClick={onClose}
              />
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </>
  );
}

function MenuLink({
  href,
  title,
  description,
  onClick,
}: {
  href: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-2xl px-4 py-3 transition hover:bg-white/[0.06]"
    >
      <p className="font-black text-white">
        {title}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {description}
      </p>
    </Link>
  );
}