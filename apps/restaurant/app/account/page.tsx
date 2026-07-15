'use client';

import Link from 'next/link';
import { useAccount } from '../../components/account/AccountProvider';

export default function AccountPage() {
  const { customer, loading } = useAccount();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070504] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070504] px-5 text-white">
        <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-3xl font-black">
            Account required
          </h1>

          <p className="mt-4 text-zinc-400">
            Log in from the account button in the website header.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-full bg-white px-7 py-4 font-black text-black"
          >
            Back to website
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070504] px-5 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-bold text-amber-300"
        >
          ← Back to DaWu
        </Link>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
            My Account
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Welcome, {customer.name}
          </h1>

          <p className="mt-3 text-zinc-400">
            {customer.email}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <AccountCard
            href="/account/reservations"
            title="Reservations"
            description="View upcoming and previous bookings."
          />

          <AccountCard
            href="/account/orders"
            title="Order History"
            description="View restaurant and takeaway orders."
          />

          <AccountCard
            href="/account/deliveries"
            title="Deliveries"
            description="View delivery orders and statuses."
          />
        </div>
      </div>
    </main>
  );
}

function AccountCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[26px] border border-white/10 bg-black/40 p-6 transition hover:-translate-y-1 hover:border-amber-300/40"
    >
      <h2 className="text-xl font-black">{title}</h2>

      <p className="mt-3 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </Link>
  );
}