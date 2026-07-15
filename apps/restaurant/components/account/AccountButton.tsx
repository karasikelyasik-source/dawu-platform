'use client';

import { useState } from 'react';
import { useAccount } from './AccountProvider';
import AuthModal from './AuthModal';
import AccountMenu from './AccountMenu';

export default function AccountButton() {
  const { customer, loading } = useAccount();

  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleClick() {
    if (loading) {
      return;
    }

    if (customer) {
      setMenuOpen((current) => !current);
      return;
    }

    setAuthOpen(true);
  }

  const firstLetter =
    customer?.name?.trim().charAt(0).toUpperCase() || '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          customer
            ? 'Open customer account'
            : 'Log in or register'
        }
        className={[
          'flex h-12 w-12 items-center justify-center rounded-full border transition',
          customer
            ? 'border-amber-300/40 bg-amber-300 text-black hover:bg-amber-200'
            : 'border-white/15 bg-white/[0.06] text-white hover:scale-105 hover:border-white/30 hover:bg-white/10',
        ].join(' ')}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : customer ? (
          <span className="text-lg font-black">
            {firstLetter}
          </span>
        ) : (
          <UserIcon />
        )}
      </button>

      {customer && menuOpen && (
        <AccountMenu
          customer={customer}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {!customer && authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}