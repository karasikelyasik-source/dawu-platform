'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type PackageItem = {
  id: string;
  name: string;
  price: number;
  btwRate?: number;
};

type PackageCount = {
  name: string;
  guests: number;
};

export default function StartTablePage() {
  const params = useParams();
  const tableId = params.id as string;

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  async function loadPackages() {
    const res = await fetch('http://31.57.201.45:3000/menu/packages');
    const data = await res.json();

    setPackages(Array.isArray(data) ? data : []);
  }

  async function loadTable() {
    const res = await fetch(`http://31.57.201.45:3000/tables/${tableId}`);
    const data = await res.json();

    if (Array.isArray(data.selectedPackages)) {
      const savedCounts: Record<string, number> = {};

      data.selectedPackages.forEach((item: any) => {
        savedCounts[item.name] = item.guests;
      });

      setCounts(savedCounts);
    }
  }

  function changeCount(name: string, change: number) {
    setCounts((prev) => {
      const current = prev[name] || 0;
      const next = Math.max(0, current + change);

      return {
        ...prev,
        [name]: next,
      };
    });
  }

  async function next() {
    const selected: PackageCount[] = Object.entries(counts)
      .filter(([, guests]) => guests > 0)
      .map(([name, guests]) => ({
        name,
        guests,
      }));

    if (selected.length === 0) {
      alert('Choose at least one menu');
      return;
    }

    const selectedPackages = selected.map((item) => {
      const found = packages.find(
        (pkg) => pkg.name === item.name,
      );

      return {
        name: item.name,
        guests: item.guests,
        price: found?.price ?? 0,
        btwRate: found?.btwRate ?? 9,
      };
    });

    const selectedPackage = selectedPackages
      .map((item) => `${item.name} x${item.guests}`)
      .join(', ');

    const selectedGuests = selectedPackages.reduce(
      (sum, item) => sum + item.guests,
      0,
    );

    await fetch(`http://31.57.201.45:3000/tables/${tableId}/package`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedPackage,
        selectedGuests,
        selectedPackages,
      }),
    });

    await fetch(`http://31.57.201.45:3000/tables/${tableId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'OCCUPIED',
      }),
    });

    window.location.href = `/tables/${tableId}`;
  }

  useEffect(() => {
    loadPackages();
    loadTable();
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f0ea] p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold">
            DA WU — TABLE
          </h1>

          <p className="mt-3 text-zinc-600">
            Choose menus and guests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {packages.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-zinc-300 bg-white p-10 shadow-sm"
            >
              <div className="mb-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => changeCount(item.name, -1)}
                  className="h-12 w-12 rounded-2xl bg-black text-2xl text-white"
                >
                  -
                </button>

                <div className="w-24 text-center text-4xl font-bold">
                  {counts[item.name] || 0}
                </div>

                <button
                  onClick={() => changeCount(item.name, 1)}
                  className="h-12 w-12 rounded-2xl bg-black text-2xl text-white"
                >
                  +
                </button>
              </div>

              <div className="text-3xl font-bold mb-3">
                {item.name}
              </div>

              <div className="text-zinc-500">
                €{item.price.toFixed(2)} per guest
              </div>

              <div className="mt-2 text-sm text-zinc-400">
                BTW {item.btwRate ?? 9}%
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={next}
          className="w-full rounded-2xl bg-black px-6 py-5 text-xl font-bold text-white"
        >
          Next
        </button>
      </div>
    </main>
  );
}