'use client';

import { useEffect, useState } from 'react';
import Nav from '../menu/components/nav';

type Station = {
  id: string;
  name: string;
  type: 'DRINKS' | 'SUSHI' | 'HOT_KITCHEN';
  printerIp?: string | null;
  receiptPrinter?: boolean;
  items: MenuItem[];
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  stationId?: string | null;
};

export default function PrintersPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [name, setName] = useState('');
  const [type, setType] = useState<'DRINKS' | 'SUSHI' | 'HOT_KITCHEN'>('SUSHI');
  const [printerIp, setPrinterIp] = useState('');

  async function loadStations() {
    const res = await fetch('http://localhost:3000/menu/stations');
    const data = await res.json();

    setStations(Array.isArray(data) ? data : []);
  }

  async function loadMenu() {
    const res = await fetch('http://localhost:3000/menu');
    const data = await res.json();

    const allItems = data.flatMap((category: any) => category.items || []);

    setItems(allItems);
  }

  async function addStation() {
    if (!name.trim()) return;

    await fetch('http://localhost:3000/menu/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        printerIp,
      }),
    });

    setName('');
    setPrinterIp('');

    await loadStations();
  }

  async function deleteStation(id: string) {
    await fetch(`http://localhost:3000/menu/stations/${id}`, {
      method: 'DELETE',
    });

    await loadStations();
    await loadMenu();
  }

  async function assignItemToStation(menuItemId: string, stationId: string) {
    await fetch('http://localhost:3000/menu/items/station', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menuItemId,
        stationId: stationId || null,
      }),
    });

    await loadStations();
    await loadMenu();
  }

  async function setReceiptPrinter(id: string) {
    await fetch(
      `http://localhost:3000/menu/stations/${id}/receipt-printer`,
      {
        method: 'PATCH',
      },
    );

    await loadStations();
  }

  useEffect(() => {
    loadStations();
    loadMenu();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Nav />

        <h1 className="text-3xl font-bold mb-2">
          Printers & Routing
        </h1>

        <p className="text-zinc-400 mb-8">
          Assign menu items to printers and kitchen stations
        </p>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Add Printer Station
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="Station name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as
                    | 'DRINKS'
                    | 'SUSHI'
                    | 'HOT_KITCHEN',
                )
              }
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
            >
              <option value="SUSHI">Sushi</option>
              <option value="HOT_KITCHEN">Hot Kitchen</option>
              <option value="DRINKS">Drinks</option>
            </select>

            <input
              className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
              placeholder="Printer name / IP"
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
            />

            <button
              onClick={addStation}
              className="rounded-xl bg-white text-black font-bold px-6 py-3"
            >
              Add Station
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xl font-bold mb-4">
              Printer Stations
            </h2>

            <div className="space-y-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {station.name}

                        {station.receiptPrinter && (
                          <span className="text-xs rounded-lg bg-green-500/10 border border-green-500/30 px-2 py-1 text-green-400">
                            RECEIPT PRINTER
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-zinc-400">
                        {station.type} · Printer:{' '}
                        {station.printerIp || 'Not set'}
                      </div>

                      <div className="text-xs text-zinc-500 mt-1">
                        {station.items.length} assigned items
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReceiptPrinter(station.id)}
                        className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-400"
                      >
                        Use for Receipts
                      </button>

                      <button
                        onClick={() => deleteStation(station.id)}
                        className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {stations.length === 0 && (
                <div className="text-zinc-500">
                  No printer stations yet
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xl font-bold mb-4">
              Menu Item Routing
            </h2>

            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">
                        {item.name}
                      </div>

                      <div className="text-sm text-zinc-400">
                        €{item.price ?? 0}
                      </div>
                    </div>

                    <select
                      value={item.stationId || ''}
                      onChange={(e) =>
                        assignItemToStation(
                          item.id,
                          e.target.value,
                        )
                      }
                      className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
                    >
                      <option value="">No printer</option>

                      {stations.map((station) => (
                        <option
                          key={station.id}
                          value={station.id}
                        >
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-zinc-500">
                  No menu items yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}