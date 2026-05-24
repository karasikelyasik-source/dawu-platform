'use client';

import { useEffect, useState } from 'react';
import Nav from '../menu/components/nav';

type LogItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  undone?: boolean;
  table?: {
    number: number;
  };
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);

  async function loadLogs() {
    const res = await fetch('http://31.57.201.45:3000/tables/logs/all');
    const data = await res.json();

    setLogs(Array.isArray(data) ? data : []);
  }

  async function undoLog(id: string) {
    await fetch(`http://31.57.201.45:3000/tables/logs/${id}/undo`, {
      method: 'POST',
    });

    await loadLogs();
  }

  async function clearLogs() {
    const confirmed = confirm(
      'Are you sure you want to clear all logs?',
    );

    if (!confirmed) return;

    await fetch(
      'http://31.57.201.45:3000/tables/logs/clear/all',
      {
        method: 'DELETE',
      },
    );

    await loadLogs();
  }

  useEffect(() => {
    loadLogs();

    const interval = setInterval(() => {
      loadLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function getStyle(type: string) {
    if (type === 'ORDER_ADDED') {
      return 'bg-green-500/10 text-green-400 border-green-500/30';
    }

    if (type === 'ORDER_REMOVED') {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }

    if (type === 'MENU_CHANGED') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    }

    if (type === 'STATUS_CHANGED') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }

    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Nav />

        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Logs
            </h1>

            <p className="text-zinc-400 mt-2">
              Live activity history across all tables
            </p>
          </div>

          <button
            onClick={clearLogs}
            className="rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-3 text-red-400 font-semibold"
          >
            Clear Logs
          </button>
        </div>

        <div className="space-y-3">
          {logs.length === 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-500">
              No logs yet
            </div>
          )}

          {logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-2xl border p-5 ${
                log.undone
                  ? 'bg-zinc-900/40 border-zinc-800 opacity-50'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-lg font-bold">
                    Table {log.table?.number ?? '-'}
                  </div>

                  <div
                    className={`rounded-lg border px-3 py-1 text-xs font-bold ${getStyle(
                      log.type,
                    )}`}
                  >
                    {log.type.replaceAll('_', ' ')}
                  </div>

                  {log.undone && (
                    <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                      UNDONE
                    </div>
                  )}
                </div>

                <div className="text-sm text-zinc-500">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="text-zinc-300 mb-4">
                {log.message}
              </div>

              {!log.undone &&
  (log.type === 'STATUS_CHANGED' ||
log.type === 'TABLE_READY' ||
log.type === 'PAYMENT_DELETED' ||
log.type === 'TIP_REMOVED' ||
log.type === 'REVENUE_CLEARED') && (
                <button
                  onClick={() => undoLog(log.id)}
                  className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-sm font-semibold text-blue-400"
                >
                  Undo Action
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}