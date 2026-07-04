export default function Home() {
  return (
    <main className="min-h-screen bg-[#070504] text-white">
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

      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2200')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-24">
          <div className="max-w-3xl">
            <div className="mb-6 text-sm font-bold uppercase tracking-[0.45em] text-amber-300">
              Japanese Dining Experience
            </div>

            <h1 className="text-6xl font-black leading-[0.95] tracking-tight md:text-8xl">
              Sushi, Grill
              <br />
              & Fusion.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-zinc-300">
              Enjoy fresh sushi, warm dishes and grill specialties in a modern
              all you can eat experience.
            </p>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <a
                href="#reservation"
                className="rounded-full bg-amber-300 px-9 py-5 text-center text-sm font-black uppercase tracking-[0.2em] text-black transition hover:scale-105"
              >
                Reserve a Table
              </a>

              <a
                href="#menu"
                className="rounded-full border border-white/30 px-9 py-5 text-center text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
              >
                View Menu
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-zinc-400 md:block">
          Scroll
        </div>
      </section>
    </main>
  );
}