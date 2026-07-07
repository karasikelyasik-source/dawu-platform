'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '../menu/components/nav';

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  guests: number;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  tableId?: string | null;
  table?: {
  id: string;
  number: number;
} | null;
};

const API_URL = 'http://31.57.201.45:3000';

const statusStyles: Record<Reservation['status'], string> = {
  PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  CONFIRMED: 'border-green-500/30 bg-green-500/10 text-green-300',
  CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
  COMPLETED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  NO_SHOW: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'TODAY' | 'ALL'>('TODAY');

  async function loadReservations() {
    const endpoint =
      filter === 'TODAY' ? '/reservations/today' : '/reservations';

    const res = await fetch(`${API_URL}${endpoint}`);
    const data = await res.json();

    setReservations(Array.isArray(data) ? data : []);
  }

  async function updateStatus(
    id: string,
    status: Reservation['status'],
  ) {
    await fetch(`${API_URL}/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    await loadReservations();
  }

  useEffect(() => {
    loadReservations();
  }, [filter]);

async function assignTable(id: string) {
  const tableId = prompt('Paste table ID for this reservation');

  if (!tableId) return;

  await fetch(`${API_URL}/reservations/${id}/assign-table`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableId }),
  });

  await loadReservations();
}

  const grouped = useMemo(() => {
    return reservations.reduce<Record<string, Reservation[]>>(
      (acc, item) => {
        const day = new Date(item.startTime).toLocaleDateString('nl-NL');

        if (!acc[day]) acc[day] = [];
        acc[day].push(item);

        return acc;
      },
      {},
    );
  }, [reservations]);

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Nav />

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Reservations</h1>
            <p className="text-zinc-400">
              Online and staff reservations overview
            </p>
          </div>

          <div className="flex gap-3">
            {['TODAY', 'ALL'].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item as 'TODAY' | 'ALL')}
                className={`rounded-xl border px-4 py-2 font-bold ${
                  filter === item
                    ? 'border-white bg-white text-black'
                    : 'border-zinc-800 bg-zinc-900 text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {Object.entries(grouped).map(([day, items]) => (
          <div key={day} className="mb-8">
            <h2 className="mb-4 text-xl font-black text-amber-300">
              {day}
            </h2>

            <div className="grid gap-4">
              {items.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <div className="text-2xl font-black">
                          {reservation.name}
                        </div>

                        <div
                          className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[reservation.status]}`}
                        >
                          {reservation.status}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-zinc-400">
                        <div>
                          Time:{' '}
                          <span className="text-white">
                            {new Date(reservation.startTime).toLocaleTimeString(
                              'nl-NL',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>

                        <div>
                          Guests:{' '}
                          <span className="text-white">
                            {reservation.guests}
                          </span>
                        </div>
{reservation.table && (
  <div>
    Table:{' '}
    <span className="text-amber-300">
      {reservation.table.number}
    </span>
  </div>
)}
                        <div>
                          Phone:{' '}
                          <span className="text-white">
                            {reservation.phone}
                          </span>
                        </div>

                        {reservation.email && (
                          <div>
                            Email:{' '}
                            <span className="text-white">
                              {reservation.email}
                            </span>
                          </div>
                        )}

                        {reservation.message && (
                          <div>
                            Message:{' '}
                            <span className="text-white">
                              {reservation.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          updateStatus(reservation.id, 'CONFIRMED')
                        }
                        className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 font-bold text-green-300"
                      >
                        Confirm
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(reservation.id, 'COMPLETED')
                        }
                        className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 font-bold text-blue-300"
                      >
                        Completed
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(reservation.id, 'NO_SHOW')
                        }
                        className="rounded-xl border border-zinc-500/30 bg-zinc-500/10 px-4 py-2 font-bold text-zinc-300"
                      >
                        No Show
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(reservation.id, 'CANCELLED')
                        }
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-bold text-red-300"
                      >
                        Cancel
                      </button>
{reservation.table ? (
  <button
    disabled
    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-bold text-amber-300 opacity-60"
  >
    Table {reservation.table.number}
  </button>
) : (
  <button
    onClick={() => assignTable(reservation.id)}
    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-bold text-amber-300"
  >
    Assign Table
  </button>
)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {reservations.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-500">
            No reservations found
          </div>
        )}
      </div>
    </main>
  );
}