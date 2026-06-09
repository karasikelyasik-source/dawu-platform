'use client';

import { useState } from 'react';

const API_URL = '/api-proxy';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function register() {
    if (loading) return;

    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || 'Registration failed');
        return;
      }

      setMessage('Account created successfully ✅');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (error) {
      console.log('Register failed:', error);
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] p-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <h1 className="text-4xl font-black">DaWu Register</h1>
        <p className="mt-2 text-zinc-500">Create staff account</p>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none focus:border-emerald-500"
            placeholder="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                register();
              }
            }}
          />

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
              {message}
            </div>
          )}

          <button
            onClick={register}
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-4 font-black text-black disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>


          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 font-black text-white hover:border-emerald-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}