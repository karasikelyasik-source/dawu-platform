'use client';

import { useEffect, useState } from 'react';
import Nav from './menu/components/nav';

type Table = {
  id: string;
  number: number;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
  selectedPackage?: string | null;
};

export default function TablesDashboard() {
  const [tables, setTables] = useState<Table[]>([]);

  async function loadTables() {
    const res = await fetch('http://31.57.201.45:3000/tables', {
      cache: 'no-store',
    });

    const data = await res.json();

    setTables(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadTables();

    const interval = setInterval(() => {
      loadTables();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Nav />

        <h1 className="text-3xl font-bold mb-2">
          DaWu Staff Dashboard
        </h1>

        <p className="text-zinc-400 mb-8">
          Click a table to open its page
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => {
                if (table.selectedPackage) {
                  window.location.href = `/tables/${table.id}`;
                } else {
                  window.location.href = `/tables/${table.id}/start`;
                }
              }}
              className="cursor-pointer rounded-2xl bg-zinc-900 border border-zinc-800 p-4 transition-all hover:border-zinc-600"
            >
              <div className="text-xl font-bold">
                Table {table.number}
              </div>

              <div className="text-sm text-zinc-400">
                {table.seats} seats
              </div>

              {table.selectedPackage && (
                <div className="mt-2 text-sm text-yellow-400 font-semibold">
                  {table.selectedPackage}
                </div>
              )}

              <div
                className={`mt-4 text-sm font-semibold ${
                  table.status === 'AVAILABLE'
                    ? 'text-green-400'
                    : table.status === 'OCCUPIED'
                    ? 'text-red-400'
                    : table.status === 'CLEANING'
                    ? 'text-yellow-400'
                    : 'text-blue-400'
                }`}
              >
                {table.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}