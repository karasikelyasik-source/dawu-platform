'use client';

import { useAccount } from './account/AccountProvider';
import { useRestaurantSettings } from './restaurant-settings/RestaurantSettingsProvider';
import Button from './ui/Button';
import Container from './ui/Container';

export default function Hero() {
  const {
    customer,
    loading: accountLoading,
  } = useAccount();

  const {
    restaurantOpen,
    closedMessage,
    loading: settingsLoading,
  } = useRestaurantSettings();

  const hasAdminAccess =
    customer?.role === 'ADMIN' ||
    customer?.role === 'OWNER';

  const restaurantTemporarilyClosed =
    !restaurantOpen;

  const reservationAvailable =
    restaurantOpen || hasAdminAccess;

  const loading =
    accountLoading || settingsLoading;

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2200')] bg-cover bg-center opacity-45" />

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />

      <Container className="relative z-10 pt-24">
        <div className="max-w-3xl">
          {!settingsLoading &&
            restaurantTemporarilyClosed && (
              <div className="mb-7 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-300/25 bg-black/70 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.8)]" />

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                    Temporarily Closed
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-300 sm:text-base">
                    {closedMessage}
                  </p>

                  {hasAdminAccess && (
                    <p className="mt-2 text-xs font-bold text-green-300">
                      Admin access enabled — reservations remain
                      available for testing.
                    </p>
                  )}
                </div>
              </div>
            )}

          <div className="mb-6 text-sm font-bold uppercase tracking-[0.45em] text-amber-300">
            Japanese Dining Experience
          </div>

          <h1 className="text-6xl font-black leading-[0.95] tracking-tight md:text-8xl">
            Sushi, Grill
            <br />
            & Fusion.
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-9 text-zinc-300">
            Enjoy fresh sushi, warm dishes and grill specialties in a
            modern all you can eat experience.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            {!loading && reservationAvailable ? (
              <Button href="#reservation">
                {restaurantTemporarilyClosed
                  ? 'Admin Test Reservation'
                  : 'Reserve a Table'}
              </Button>
            ) : (
              <div
                aria-disabled="true"
                className="inline-flex min-h-14 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/10 px-8 text-sm font-black uppercase tracking-[0.16em] text-zinc-500"
              >
                {loading
                  ? 'Loading...'
                  : 'Reservations Unavailable'}
              </div>
            )}

            <Button
              href="#menu"
              variant="secondary"
            >
              View Menu
            </Button>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-zinc-400 md:block">
        Scroll
      </div>
    </section>
  );
}