'use client';

import AccountButton from './account/AccountButton';

export default function Header() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
        <a href="#" className="shrink-0">
          <div className="text-2xl font-black tracking-[0.3em] sm:text-3xl sm:tracking-[0.35em]">
            DAWU
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-zinc-400 sm:text-xs sm:tracking-[0.35em]">
            Sushi Fusion
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-bold uppercase tracking-[0.18em] text-zinc-300 md:flex">
          <a
            href="#menu"
            className="transition hover:text-white"
          >
            Menu
          </a>

          <a
            href="#ayce"
            className="transition hover:text-white"
          >
            All You Can Eat
          </a>

          <a
            href="#takeaway"
            className="transition hover:text-white"
          >
            Take Away
          </a>

          <a
            href="#contact"
            className="transition hover:text-white"
          >
            Contact
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AccountButton />

          <a
            href="#reservation"
            className="rounded-full bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-105 sm:px-7 sm:text-sm sm:tracking-[0.18em]"
          >
            Reserve
          </a>
        </div>
      </div>
    </header>
  );
}