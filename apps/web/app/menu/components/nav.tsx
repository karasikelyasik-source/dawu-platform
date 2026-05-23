'use client';

export default function Nav() {
  function logout() {
    sessionStorage.removeItem('dawu-user');

    window.location.href = '/login';
  }

  return (
    <div className="mb-10 flex items-center justify-between">
  <div className="flex items-center gap-4">
    <a
      href="/"
      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
    >
      Tables
    </a>

    <a
      href="/menu"
      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
    >
      Menu
    </a>

    <a
      href="/packages"
      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
    >
      Packages
    </a>

    <a
      href="/logs"
      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
    >
      Logs
    </a>

    <a
      href="/printers"
      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
    >
      Printers
    </a>

    <a
      href="/tips"
      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
    >
      Tips
    </a>

      <a
  href="/revenue"
  className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
>
  Revenue
</a>
  </div>


  <button
    className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400"
  >
    Logout
  </button>
</div>
  );
}