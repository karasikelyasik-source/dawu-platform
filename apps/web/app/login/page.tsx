'use client';

import { useEffect, useState } from 'react';

const API_URL = '/api-proxy';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dawu.nl');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('dawu_login_email');

    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  async function login() {
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || 'Wrong email or password');
        return;
      }

      localStorage.setItem('dawu_login_email', email);
      sessionStorage.setItem('dawu-user', JSON.stringify(data));

      if (data.sessionId) {
        sessionStorage.setItem('dawu-session-id', data.sessionId);
      }

      setPassword('');
      window.location.href = '/';
    } catch (error) {
      console.log('Login failed:', error);
      setError('Cannot connect to server. Please check API connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] p-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <h1 className="text-4xl font-black">DaWu Login</h1>
        <p className="mt-2 text-zinc-500">Staff access only</p>

        <div className="mt-8 space-y-4">
          <input
            className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none focus:border-emerald-500"
            placeholder="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none focus:border-emerald-500"
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                login();
              }
            }}
          />

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-4 font-black text-black disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
  onClick={() => {
    window.location.href = '/register';
  }}
  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 font-black text-white hover:border-emerald-500"
>
  Create Account
</button>
        </div>
      </div>
    </main>
  );
}