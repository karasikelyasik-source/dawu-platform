'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const tableNames = [
  'A1', 'A2', 'A3', 'A4', 'A5',
  'A6', 'A7', 'A8', 'A9', 'A10',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
  'A15', 'A16', 'A17', 'A18',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
  'C7', 'C8', 'C9', 'C9a', 'C10', 'C10a',
  'C15', 'C16', 'C17', 'C18', 'C19',
];

export default function QRCodesPage() {
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    async function generate() {
      const result: Record<string, string> = {};

      for (const table of tableNames) {
        const url = `http://localhost:3001/table-order/${table}`;

        result[table] = await QRCode.toDataURL(url);
      }

      setCodes(result);
    }

    generate();
  }, []);

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-black">
          DaWu QR Codes
        </h1>

        <button
          onClick={() => window.print()}
          className="mt-4 rounded-xl bg-white px-6 py-3 font-bold text-black"
        >
          Print All QR Codes
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-6">
        {tableNames.map((table) => (
          <div
            key={table}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center"
          >
            <div className="mb-3 text-2xl font-black">
              {table}
            </div>

            {codes[table] && (
              <img
                src={codes[table]}
                alt={table}
                className="mx-auto w-full"
              />
            )}

            <div className="mt-3 text-xs text-zinc-500">
              Scan to Order
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}