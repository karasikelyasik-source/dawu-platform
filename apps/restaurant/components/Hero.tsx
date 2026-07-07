import Button from './ui/Button';
import Container from './ui/Container';

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2200')] bg-cover bg-center opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />

      <Container className="relative z-10 pt-24">
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
            <Button href="#reservation">Reserve a Table</Button>
            <Button href="#menu" variant="secondary">View Menu</Button>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-zinc-400 md:block">
        Scroll
      </div>
    </section>
  );
}