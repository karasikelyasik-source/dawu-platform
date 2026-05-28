'use client';
import { useEffect, useState } from 'react';
import Nav from '../menu/components/nav';

const layout = [
  { name: 'A1', x: 2, y: 4 }, { name: 'A2', x: 2, y: 14 }, { name: 'A3', x: 2, y: 24 }, { name: 'A4', x: 2, y: 34 }, { name: 'A5', x: 2, y: 44 },
 { name: 'A6', x: 8, y: 4 }, { name: 'A7', x: 8, y: 14 }, { name: 'A8', x: 8, y: 24 }, { name: 'A9', x: 8, y: 34 }, { name: 'A10', x: 8, y: 44 },

 { name: 'B4', x: 15, y: 8 }, { name: 'B3', x: 15, y: 18 }, { name: 'B2', x: 15, y: 28 }, { name: 'B1', x: 15, y: 40 },
  { name: 'B5', x: 24, y: 10 }, { name: 'B6', x: 24, y: 22 },

  { name: 'A1a', x: 25, y: 36 },

  { name: 'A15', x: 36, y: 6 }, { name: 'A16', x: 36, y: 16 }, { name: 'A17', x: 36, y: 26 }, { name: 'A18', x: 36, y: 38 },

  { name: 'C15', x: 45, y: 6 }, { name: 'C16', x: 45, y: 16 }, { name: 'C17', x: 45, y: 26 }, { name: 'C18', x: 45, y: 36 }, { name: 'C19', x: 45, y: 46 }, { name: 'C10', x: 45, y: 56 },

  { name: 'C10a', x: 39, y: 56 },

  { name: 'C1', x: 52, y: 2 }, { name: 'C2', x: 52, y: 12 }, { name: 'C3', x: 52, y: 22 }, { name: 'C4', x: 52, y: 32 }, { name: 'C5', x: 52, y: 42 }, { name: 'C6', x: 52, y: 52 },

  { name: 'C7', x: 60, y: 20 }, { name: 'C8', x: 60, y: 32 }, { name: 'C9', x: 60, y: 44 }, { name: 'C9a', x: 60, y: 54 },
];

export default function PlattegrondPage() {
    const [tables, setTables] = useState<any[]>([]);

useEffect(() => {
  loadTables();

  const interval = setInterval(() => {
    loadTables();
  }, 2000);

  return () => clearInterval(interval);
}, []);

async function loadTables() {
  try {
    const res = await fetch('http://31.57.201.45:3000/tables', {
      cache: 'no-store',
    });

    const data = await res.json();

    setTables(Array.isArray(data) ? data : []);
  } catch (e) {
    console.log(e);
  }
}
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <Nav />

      <div className="mx-auto max-w-[1500px]">
        <h1 className="text-5xl font-black mb-3">Plattegrond</h1>
        <p className="text-zinc-400 mb-8">Restaurant table layout</p>

        <div className="relative h-[720px] rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
{layout.map((table) => {
  const realTable = tables.find(
    (t) =>
      t.number?.toString() ===
      table.name.replace(/[A-Z]/g, '').replace('a', ''),
  );

  const status = realTable?.status || 'AVAILABLE';

  return (
    <button
  key={table.name}
  onClick={() => {
    if (!realTable?.id) return;

    if (realTable.selectedPackage) {
      window.location.href = `/tables/${realTable.id}`;
    } else {
      window.location.href = `/tables/${realTable.id}/start`;
    }
  }}
      className={`absolute flex items-center justify-center rounded-xl border text-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 ${
        status === 'OCCUPIED'
          ? 'bg-red-600 border-red-400 text-white'
          : status === 'RESERVED'
          ? 'bg-blue-600 border-blue-400 text-white'
          : status === 'CLEANING'
          ? 'bg-yellow-500 border-yellow-300 text-black'
          : 'bg-zinc-800 border-zinc-700 text-zinc-100'
      }`}
      style={{
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: '74px',
        height: '82px',
      }}
    >
      {table.name}
    </button>
  );
})}
  </div>
      </div>
    </main>
  );
}