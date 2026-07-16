'use client';

import Link from 'next/link';
import { useAccount } from '../../components/account/AccountProvider';

export default function AdminPage() {
  const { customer, loading } = useAccount();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070504] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />
      </main>
    );
  }

  const hasAccess =
    customer?.role === 'OWNER' ||
    customer?.role === 'ADMIN';

  if (!customer || !hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070504] px-5 text-white">
        <div className="w-full max-w-lg rounded-[34px] border border-white/10 bg-white/[0.035] p-9 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Access denied
          </p>

          <h1 className="mt-4 text-4xl font-black">
            Admin access required
          </h1>

          <p className="mt-4 leading-7 text-zinc-400">
            This page is only available to authorised DaWu administrators.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 font-black text-black"
          >
            Back to DaWu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070504] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="text-sm font-black text-amber-300"
        >
          ← Back to website
        </Link>

        <div className="mt-8 rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
            DaWu Administration
          </p>

          <h1 className="mt-4 text-5xl font-black">
            Customer Support
          </h1>

          <p className="mt-4 text-zinc-400">
            Logged in as {customer.email}
          </p>

          <div className="mt-6 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">
            {customer.role}
          </div>
        </div>
      </div>
    </main>
  );
}