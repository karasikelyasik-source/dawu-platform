export default function Header() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <div>
          <div className="text-3xl font-black tracking-[0.35em]">DAWU</div>
          <div className="mt-1 text-xs uppercase tracking-[0.35em] text-zinc-400">
            Sushi Fusion
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-bold uppercase tracking-[0.18em] text-zinc-300 md:flex">
          <a href="#menu" className="hover:text-white">Menu</a>
          <a href="#ayce" className="hover:text-white">All You Can Eat</a>
          <a href="#takeaway" className="hover:text-white">Take Away</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </nav>

        <a
          href="#reservation"
          className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:scale-105"
        >
          Reserve
        </a>
      </div>
    </header>
  );
}