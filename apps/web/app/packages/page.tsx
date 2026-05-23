'use client';

import { useEffect, useState } from 'react';
import Nav from '../menu/components/nav';

type PackageItem = {
  id: string;
  name: string;
  price: number;
  btwRate: number;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [btwRate, setBtwRate] = useState('9');

  async function loadPackages() {
    const res = await fetch('http://localhost:3000/menu/packages');
    const data = await res.json();
    setPackages(Array.isArray(data) ? data : []);
  }

  async function addPackage() {
    if (!name.trim()) return;

    await fetch('http://localhost:3000/menu/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        price: Number(price),
        btwRate: Number(btwRate),
      }),
    });

    setName('');
    setPrice('');
    setBtwRate('9');

    await loadPackages();
  }

  async function deletePackage(id: string) {
    await fetch(`http://localhost:3000/menu/packages/${id}`, {
      method: 'DELETE',
    });

    await loadPackages();
  }

  useEffect(() => {
    loadPackages();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Nav />

        <h1 className="text-3xl font-bold mb-2">Packages</h1>

        <p className="text-zinc-400 mb-8">
          Manage table menu options
        </p>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Add Package
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="Example: AYCE + Drinks"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              type="number"
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="BTW %"
              value={btwRate}
              onChange={(e) => setBtwRate(e.target.value)}
            />

            <button
              onClick={addPackage}
              className="rounded-xl bg-white text-black font-bold px-6 py-3"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {packages.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 p-4"
            >
              <div>
                <div className="font-semibold">
                  {item.name}
                </div>

                <div className="text-sm text-zinc-400 mt-1">
                  €{item.price.toFixed(2)}
                </div>

                <div className="text-xs text-zinc-500 mt-1">
                  BTW {item.btwRate ?? 9}%
                </div>
              </div>

              <button
                onClick={() => deletePackage(item.id)}
                className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1 text-sm text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}