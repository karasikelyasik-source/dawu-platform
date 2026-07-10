'use client';

import { RestaurantTable } from './types';

type Props = {
  tables: RestaurantTable[];
  selectedTableId: string;
  loading: boolean;
  assigning: boolean;
  onSelect: (tableId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function AssignTableModal({
  tables,
  selectedTableId,
  loading,
  assigning,
  onSelect,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] border border-neutral-800 bg-neutral-950 p-5 shadow-2xl sm:rounded-[32px]">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-700 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
              DaWu Staff
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Assign Table
            </h2>

            <p className="mt-2 text-sm text-neutral-400">
              Select an available table for this reservation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-xl text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-6 text-center text-neutral-400">
            Loading available tables...
          </div>
        ) : tables.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-orange-900/60 bg-orange-950/30 p-5 text-center text-orange-200">
            No available tables found.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {tables.map((table) => {
              const selected = selectedTableId === table.id;

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelect(table.id)}
                  className={[
                    'rounded-2xl border p-4 text-left transition',
                    selected
                      ? 'border-yellow-500 bg-yellow-500 text-black'
                      : 'border-neutral-800 bg-black text-white hover:border-neutral-600',
                  ].join(' ')}
                >
                  <p
                    className={
                      selected
                        ? 'text-xs uppercase tracking-[0.2em] text-black/60'
                        : 'text-xs uppercase tracking-[0.2em] text-neutral-500'
                    }
                  >
                    Table
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {table.label || String(table.number)}
                  </p>

                  <p
                    className={
                      selected
                        ? 'mt-2 text-sm text-black/70'
                        : 'mt-2 text-sm text-neutral-400'
                    }
                  >
                    {table.seats} seats
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
              assigning ||
              !selectedTableId ||
              tables.length === 0
            }
            className="w-full rounded-2xl bg-yellow-500 px-5 py-4 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {assigning ? 'Assigning table...' : 'Confirm Table'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={assigning}
            className="w-full rounded-2xl border border-neutral-700 px-5 py-4 font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}