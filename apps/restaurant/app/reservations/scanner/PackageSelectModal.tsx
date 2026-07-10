'use client';

import { RestaurantPackage } from './types';

type Props = {
  packages: RestaurantPackage[];
  selectedPackageId: string;
  loading: boolean;
  opening: boolean;
  onSelect: (packageId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function PackageSelectModal({
  packages,
  selectedPackageId,
  loading,
  opening,
  onSelect,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] border border-neutral-800 bg-neutral-950 p-5 shadow-2xl sm:rounded-[32px]">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-700 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
              DaWu Staff
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Choose Menu
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Select the menu package for all guests.
              The table will open automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={opening}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-xl text-neutral-400 transition hover:bg-neutral-900 hover:text-white disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-6 text-center text-neutral-400">
            Loading menu packages...
          </div>
        ) : packages.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-orange-900/60 bg-orange-950/30 p-5 text-center text-orange-200">
            No menu packages found.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {packages.map((restaurantPackage) => {
              const selected =
                selectedPackageId ===
                restaurantPackage.id;

              return (
                <button
                  key={restaurantPackage.id}
                  type="button"
                  onClick={() =>
                    onSelect(restaurantPackage.id)
                  }
                  className={[
                    'w-full rounded-2xl border p-5 text-left transition',
                    selected
                      ? 'border-yellow-500 bg-yellow-500 text-black'
                      : 'border-neutral-800 bg-black text-white hover:border-neutral-600',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className={
                          selected
                            ? 'text-xs uppercase tracking-[0.2em] text-black/60'
                            : 'text-xs uppercase tracking-[0.2em] text-neutral-500'
                        }
                      >
                        Menu
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {restaurantPackage.name}
                      </p>
                    </div>

                    <div
                      className={[
                        'flex h-8 w-8 items-center justify-center rounded-full border text-lg',
                        selected
                          ? 'border-black/20 bg-black/10'
                          : 'border-neutral-700',
                      ].join(' ')}
                    >
                      {selected ? '✓' : ''}
                    </div>
                  </div>

                  <p
                    className={
                      selected
                        ? 'mt-3 text-sm text-black/70'
                        : 'mt-3 text-sm text-neutral-400'
                    }
                  >
                    {restaurantPackage.price > 0
                      ? `€${restaurantPackage.price.toFixed(2)} per guest`
                      : 'Price not configured'}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              loading ||
              opening ||
              !selectedPackageId ||
              packages.length === 0
            }
            className="w-full rounded-2xl bg-yellow-500 px-5 py-4 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {opening
              ? 'Opening table...'
              : 'Open Table'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={opening}
            className="w-full rounded-2xl border border-neutral-700 px-5 py-4 font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}