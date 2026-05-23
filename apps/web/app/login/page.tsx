'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dawu.nl');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  async function login() {
    setError('');

    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError('Wrong email or password');
      return;
    }

    const user = await res.json();

    sessionStorage.setItem('dawu-user', JSON.stringify(user));

    window.location.href = '/';
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-8">
        <h1 className="text-3xl font-bold mb-2">DaWu Login</h1>
        <p className="text-zinc-400 mb-8">Staff access only</p>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={login}
            className="w-full rounded-xl bg-white text-black font-bold px-4 py-3"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}