'use client';

import Nav from '../menu/components/nav';

const hotkeys = [
  { keys: 'Enter', action: 'Login / confirm form' },
  { keys: 'Ctrl + L', action: 'Logout' },
  { keys: 'Ctrl + 1', action: 'Open Tables' },
  { keys: 'Ctrl + 2', action: 'Open Menu' },
  { keys: 'Ctrl + 3', action: 'Open Sessions' },
  { keys: 'Esc', action: 'Close modal window' },
];

export default function HotkeysPage() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <Nav />

      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-3">Hotkeys</h1>

        <p className="text-zinc-400 mb-10">
          Keyboard shortcuts for faster POS control
        </p>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="space-y-4">
            {hotkeys.map((item) => (
              <div
                key={item.keys}
                className="flex items-center justify-between rounded-2xl bg-zinc-950 border border-zinc-800 p-5"
              >
                <div className="text-zinc-300">
                  {item.action}
                </div>

                <div className="flex gap-2">
                  {item.keys.split(' + ').map((key) => (
                    <kbd
                      key={key}
                      className="rounded-xl bg-white text-black px-4 py-2 font-bold shadow"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}