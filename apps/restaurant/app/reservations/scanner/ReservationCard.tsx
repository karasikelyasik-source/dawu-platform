'use client';

import { Reservation } from './types';

type Props = {
  reservation: Reservation;
  checkingIn: boolean;
  openedPackageName?: string;
  onCheckIn: () => void;
  onAssignTable: () => void;
  onChoosePackage: () => void;
  onScanAgain: () => void;
};

export default function ReservationCard({
  reservation,
  checkingIn,
  openedPackageName,
  onCheckIn,
  onAssignTable,
  onChoosePackage,
  onScanAgain,
}: Props) {
  const reservationTime = new Date(
    reservation.startTime,
  ).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const checkedInTime = reservation.checkedInAt
    ? new Date(
        reservation.checkedInAt,
      ).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const isCheckedIn = Boolean(
    reservation.checkedInAt,
  );

  const hasTable = Boolean(
    reservation.table?.id,
  );

  const tableIsOpen =
    reservation.table?.status === 'OCCUPIED';

  const tableName = reservation.table
    ? reservation.table.label ||
      String(reservation.table.number)
    : null;

  return (
    <div className="mt-6 rounded-[32px] border border-yellow-700/40 bg-neutral-950 p-6 shadow-2xl">
      <div className="text-center">
        <div
          className={[
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold',
            tableIsOpen
              ? 'bg-green-500 text-black'
              : isCheckedIn
                ? 'bg-green-500 text-black'
                : 'bg-yellow-500 text-black',
          ].join(' ')}
        >
          {tableIsOpen || isCheckedIn ? '✓' : '•'}
        </div>

        <p
          className={[
            'mt-4 text-sm uppercase tracking-[0.3em]',
            tableIsOpen || isCheckedIn
              ? 'text-green-400'
              : 'text-yellow-500',
          ].join(' ')}
        >
          {tableIsOpen
            ? 'Table Opened'
            : isCheckedIn
              ? 'Checked In'
              : 'Reservation Found'}
        </p>

        <h2 className="mt-3 text-3xl font-semibold text-white">
          {reservation.name}
        </h2>

        {isCheckedIn &&
          checkedInTime &&
          !tableIsOpen && (
            <p className="mt-2 text-sm text-green-300">
              Checked in at {checkedInTime}
            </p>
          )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Info
          label="Guests"
          value={String(reservation.guests)}
        />

        <Info
          label="Time"
          value={reservationTime}
        />

        <Info
          label="Status"
          value={reservation.status}
        />

        <Info
          label="Table"
          value={
            tableName
              ? `Table ${tableName}`
              : '—'
          }
        />
      </div>

      {tableIsOpen && (
        <div className="mt-5 rounded-2xl border border-green-800/70 bg-green-950/30 p-5 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-green-400">
            Session Created
          </p>

          <p className="mt-2 text-3xl font-semibold text-white">
            Table {tableName}
          </p>

          {openedPackageName && (
            <p className="mt-2 text-sm text-green-200">
              {openedPackageName} ·{' '}
              {reservation.guests} guests
            </p>
          )}

          <p className="mt-3 text-sm text-neutral-400">
            The table is now active in DaWu POS.
          </p>
        </div>
      )}

      {hasTable && !tableIsOpen && (
        <div className="mt-5 rounded-2xl border border-yellow-800/60 bg-yellow-950/20 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-yellow-500">
            Table Assigned
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            Table {tableName}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {!isCheckedIn && (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={checkingIn}
            className="w-full rounded-2xl bg-yellow-500 px-5 py-4 text-base font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
          >
            {checkingIn
              ? 'Checking in...'
              : 'Check In'}
          </button>
        )}

        {isCheckedIn &&
          !hasTable &&
          !tableIsOpen && (
            <button
              type="button"
              onClick={onAssignTable}
              className="w-full rounded-2xl bg-yellow-500 px-5 py-4 text-base font-semibold text-black transition hover:bg-yellow-400"
            >
              Assign Table
            </button>
          )}

        {isCheckedIn &&
          hasTable &&
          !tableIsOpen && (
            <button
              type="button"
              onClick={onChoosePackage}
              className="w-full rounded-2xl bg-yellow-500 px-5 py-4 text-base font-semibold text-black transition hover:bg-yellow-400"
            >
              Choose Menu & Open Table
            </button>
          )}

        <button
          type="button"
          onClick={onScanAgain}
          className="w-full rounded-2xl border border-neutral-700 px-5 py-4 text-base font-semibold text-white transition hover:bg-neutral-900"
        >
          Scan Another QR
        </button>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-black p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}