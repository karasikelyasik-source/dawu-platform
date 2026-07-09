'use client';

import { Reservation } from './types';

type Props = {
  reservation: Reservation;
  checkingIn: boolean;
  onCheckIn: () => void;
  onScanAgain: () => void;
};

export default function ReservationCard({
  reservation,
  checkingIn,
  onCheckIn,
  onScanAgain,
}: Props) {
  const reservationTime = new Date(reservation.startTime).toLocaleTimeString(
    'nl-NL',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const checkedInTime = reservation.checkedInAt
    ? new Date(reservation.checkedInAt).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="mt-6 rounded-[32px] border border-yellow-700/40 bg-neutral-950 p-6 shadow-2xl">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-2xl font-bold text-black">
          {reservation.checkedInAt ? '✓' : '•'}
        </div>

        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-yellow-500">
          {reservation.checkedInAt ? 'Checked In' : 'Reservation Found'}
        </p>

        <h2 className="mt-3 text-3xl font-semibold text-white">
          {reservation.name}
        </h2>

        {reservation.checkedInAt && checkedInTime && (
          <p className="mt-2 text-sm text-green-300">
            Checked in at {checkedInTime}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Info label="Guests" value={String(reservation.guests)} />
        <Info label="Time" value={reservationTime} />
        <Info label="Status" value={reservation.status} />
        <Info
          label="Table"
          value={
            reservation.table?.number
              ? `Table ${reservation.table.number}`
              : '—'
          }
        />
      </div>

      <div className="mt-6 space-y-3">
        {!reservation.checkedInAt && (
          <button
            onClick={onCheckIn}
            disabled={checkingIn}
            className="w-full rounded-2xl bg-yellow-500 px-5 py-4 text-base font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
          >
            {checkingIn ? 'Checking in...' : 'Check In'}
          </button>
        )}

        <button
          onClick={onScanAgain}
          className="w-full rounded-2xl border border-neutral-700 px-5 py-4 text-base font-semibold text-white transition hover:bg-neutral-900"
        >
          Scan Another QR
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-black p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}