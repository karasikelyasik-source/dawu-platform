'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [systemMessage, setSystemMessage] = useState<{
    type: string;
    message: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('dawu_login_email');
    const raw = sessionStorage.getItem('dawu-system-message');

    if (savedEmail) {
      setEmail(savedEmail);
    }

    if (raw) {
      setSystemMessage(JSON.parse(raw));
      sessionStorage.removeItem('dawu-system-message');
    }
  }, []);

  async function login() {
    setError('');

    const res = await fetch('http://31.57.201.45:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

   if (!res.ok) {
  const data = await res.json().catch(() => null);

  const message =
    data?.message?.message ||
    data?.message ||
    'Wrong email or password';

  if (message === 'Email banned') {
    setError(
      data?.message?.reason
        ? `You are banned: ${data.message.reason}`
        : 'You are banned from this system',
    );
  } else if (message === 'IP banned') {
    setError(
      data?.message?.reason
        ? `Your IP is banned: ${data.message.reason}`
        : 'Your device/IP is banned from this system',
    );
  } else {
    setError('Wrong email or password');
  }

  return;
}

    const user = await res.json();

    localStorage.setItem('dawu_login_email', email);
    sessionStorage.setItem('dawu-user', JSON.stringify(user));

    if (user.sessionId) {
      sessionStorage.setItem('dawu-session-id', user.sessionId);
    }

    setPassword('');
    window.location.href = '/';
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-8">
        <h1 className="text-3xl font-bold mb-2">DaWu Login</h1>

        <p className="text-zinc-400 mb-8">Staff access only</p>

        {systemMessage && (
          <div
            className={
              systemMessage.type === 'BAN'
                ? 'mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5'
                : 'mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5'
            }
          >
            <div
              className={
                systemMessage.type === 'BAN'
                  ? 'text-red-400 text-xl font-bold'
                  : 'text-yellow-400 text-xl font-bold'
              }
            >
              {systemMessage.message}
            </div>

            <div className="text-zinc-300 mt-2">
              Reason: {systemMessage.reason}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <input
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
            placeholder="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

         <input
  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3"
  placeholder="Password"
  type="password"
  autoComplete="new-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      login();
    }
  }}
/>

{error && (
  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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