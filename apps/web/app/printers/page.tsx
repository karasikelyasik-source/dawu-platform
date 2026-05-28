'use client';

import { useEffect, useState } from 'react';
import Nav from '../menu/components/nav';

type Printer = {
  name: string;
  displayName: string;
  isDefault: boolean;
};

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
  const [printers, setPrinters] = useState<Printer[]>([]);

  const [name, setName] = useState('');
  const [type, setType] = useState<'DRINKS' | 'SUSHI' | 'HOT_KITCHEN'>('SUSHI');
  const [printerIp, setPrinterIp] = useState('');

  async function loadPrinters() {
    try {
      if (!window.dawu?.getPrinters) return;

      const data = await window.dawu.getPrinters();

      setPrinters(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log(e);
    }
  }

  async function loadStations() {
    const res = await fetch('http://31.57.201.45:3000/menu/stations');

    const data = await res.json();

    setStations(Array.isArray(data) ? data : []);
  }

  async function loadMenu() {
    const res = await fetch('http://31.57.201.45:3000/menu');

    const data = await res.json();

    const allItems = data.flatMap((category: any) => category.items || []);

    setItems(allItems);
  }

  async function addStation() {
    if (!name.trim()) return;

    await fetch('http://31.57.201.45:3000/menu/stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    await fetch(`http://31.57.201.45:3000/menu/stations/${id}`, {
      method: 'DELETE',
    });

    await loadStations();
    await loadMenu();
  }

  async function assignItemToStation(
    menuItemId: string,
    stationId: string,
  ) {
    await fetch('http://31.57.201.45:3000/menu/items/station', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
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
      `http://31.57.201.45:3000/menu/stations/${id}/receipt-printer`,
      {
        method: 'PATCH',
      },
    );

    await loadStations();
  }

  useEffect(() => {
    loadStations();
    loadMenu();
    loadPrinters();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Nav />

        <div className="mb-8">
          <div className="mb-2 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-sm font-bold text-blue-400">
            PRINTER MANAGEMENT
          </div>

          <h1 className="text-4xl font-black tracking-tight">
            Printers & Routing
          </h1>

          <p className="mt-2 text-zinc-400">
            Manage kitchen printers and menu routing
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl">
          <h2 className="mb-5 text-2xl font-black">
            Add Printer Station
          </h2>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <input
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-blue-500/40"
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
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
            >
              <option value="SUSHI">Sushi</option>
              <option value="HOT_KITCHEN">Hot Kitchen</option>
              <option value="DRINKS">Drinks</option>
            </select>

            <select
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
            >
              <option value="">
                Select printer
              </option>

              {printers.map((printer) => (
                <option
                  key={printer.name}
                  value={printer.name}
                >
                  {printer.displayName}
                  {printer.isDefault ? ' (Default)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={addStation}
              className="rounded-2xl bg-white px-6 py-3 font-black text-black transition hover:scale-[1.02]"
            >
              Add Station
            </button>
          </div>

          <div className="mt-4 text-sm text-zinc-500">
            Detected printers: {printers.length}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl">
            <h2 className="mb-5 text-2xl font-black">
              Printer Stations
            </h2>

            <div className="space-y-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-black">
                          {station.name}
                        </div>

                        {station.receiptPrinter && (
                          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-400">
                            RECEIPT PRINTER
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-zinc-400">
                        {station.type}
                      </div>

                      <div className="mt-1 text-sm text-blue-400">
                        {station.printerIp || 'No printer selected'}
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        {station.items.length} assigned items
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setReceiptPrinter(station.id)
                        }
                        className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-400 transition hover:bg-blue-500/20"
                      >
                        Receipt Printer
                      </button>

                      <button
                        onClick={() =>
                          deleteStation(station.id)
                        }
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
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

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl">
            <h2 className="mb-5 text-2xl font-black">
              Menu Item Routing
            </h2>

            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="font-bold">
                        {item.name}
                      </div>

                      <div className="mt-1 text-sm text-zinc-400">
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
                      className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none"
                    >
                      <option value="">
                        No printer
                      </option>

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