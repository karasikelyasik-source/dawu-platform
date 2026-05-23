'use client';

import { useEffect, useState } from 'react';
import Nav from './components/nav';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  btwRate: number;
  isActive: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
};

export default function MenuAdmin() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [btwRate, setBtwRate] = useState('9');
  const [categoryId, setCategoryId] = useState('');

  async function loadMenu() {
    const res = await fetch('http://localhost:3000/menu');
    const data = await res.json();

    setCategories(Array.isArray(data) ? data : []);

    if (!categoryId && data[0]) {
      setCategoryId(data[0].id);
    }
  }

  async function addItem() {
    if (!name.trim()) return;

    await fetch('http://localhost:3000/menu/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        btwRate: Number(btwRate),
        categoryId,
      }),
    });

    setName('');
    setPrice('');
    setBtwRate('9');
    await loadMenu();
  }

  async function deleteItem(id: string) {
    await fetch(`http://localhost:3000/menu/items/${id}`, {
      method: 'DELETE',
    });

    await loadMenu();
  }

  useEffect(() => {
    loadMenu();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Nav />

        <h1 className="text-3xl font-bold mb-2">Menu Admin</h1>
        <p className="text-zinc-400 mb-8">Add and view menu items</p>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Item</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="BTW %"
              value={btwRate}
              onChange={(e) => setBtwRate(e.target.value)}
            />

            <select
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              onClick={addItem}
              className="rounded-xl bg-white text-black font-bold px-4 py-3"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <section
              key={category.id}
              className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
            >
              <h2 className="text-2xl font-bold mb-4">{category.name}</h2>

              <div className="space-y-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 p-4"
                  >
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-zinc-500">
                        {item.description || 'No description'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">€{item.price ?? 0}</div>
                      <div className="text-xs text-zinc-400">
                        BTW {item.btwRate ?? 9}%
                      </div>
                      <div className="text-xs text-green-400">ACTIVE</div>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1 text-xs text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}