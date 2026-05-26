'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  function logout() {
    sessionStorage.removeItem('dawu-user');
    window.location.href = '/login';
  }

  return (
    <div className="mb-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <a href="/" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Tables</a>
        <a href="/menu" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Menu</a>
        <a href="/packages" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Packages</a>
        <a href="/logs" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Logs</a>
        <a href="/printers" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Printers</a>
        <a href="/tips" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Tips</a>
        <a href="/revenue" className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2">Revenue</a>
      </div>

      <div className="relative">
        <button
  onClick={() => setOpen(!open)}
  className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 hover:bg-zinc-800 transition"
>
  <Settings size={20} />
</button>

        {open && (
          <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 p-2 shadow-xl z-50">
            <a
              href="/sessions"
              className="block rounded-xl px-4 py-3 hover:bg-zinc-800"
            >
              Sessions
            </a>

            <button
              onClick={logout}
              className="mt-2 w-full text-left rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}