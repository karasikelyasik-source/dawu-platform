'use client';

import { useEffect, useState } from 'react';
import Nav from '../menu/components/nav';

type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  online: boolean;
  banned: boolean;
  lastSeenAt: string;
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'STAFF';
  };
};

const API = 'http://31.57.201.45:3000';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  async function loadSessions() {
    const res = await fetch(`${API}/admin-sessions`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setSessions(data);
    } else {
      setSessions([]);
    }
  }

  async function banEmail(email: string) {
    await fetch(`${API}/admin-sessions/ban-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    loadSessions();
  }

  async function unbanEmail(email: string) {
    await fetch(`${API}/admin-sessions/unban-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    loadSessions();
  }

  async function banIp(ip: string | null) {
    if (!ip) return;

    await fetch(`${API}/admin-sessions/ban-ip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });

    loadSessions();
  }

  async function unbanIp(ip: string | null) {
    if (!ip) return;

    await fetch(`${API}/admin-sessions/unban-ip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });

    loadSessions();
  }

  async function kickSession(id: string) {
    await fetch(`${API}/admin-sessions/${id}/kick`, {
      method: 'PATCH',
    });

    loadSessions();
  }

  async function changeRole(userId: string, role: 'ADMIN' | 'STAFF') {
    await fetch(`${API}/admin-sessions/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    loadSessions();
  }

  useEffect(() => {
    loadSessions();

    const timer = setInterval(loadSessions, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <Nav />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-3">Active Sessions</h1>

        <p className="text-zinc-400 mb-10">
          Online users, IP addresses and permissions
        </p>

        <div className="space-y-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 flex items-center justify-between gap-6"
            >
              <div>
                <div className="text-2xl font-bold">
                  {session.user.email}
                </div>

                <div className="text-zinc-400 mt-2">
                  IP: {session.ip || 'Unknown'}
                </div>

                <div className="text-zinc-400">
                  Role: {session.user.role}
                </div>

                <div className="text-zinc-500 text-sm mt-1">
                  Last seen: {new Date(session.lastSeenAt).toLocaleString()}
                </div>

                <div
                  className={
                    session.banned
                      ? 'text-red-400 mt-2'
                      : session.online
                        ? 'text-green-400 mt-2'
                        : 'text-zinc-500 mt-2'
                  }
                >
                  {session.banned
                    ? 'BANNED'
                    : session.online
                      ? 'ONLINE'
                      : 'OFFLINE'}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() =>
                    changeRole(
                      session.user.id,
                      session.user.role === 'ADMIN' ? 'STAFF' : 'ADMIN',
                    )
                  }
                  className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 text-yellow-400"
                >
                  Make {session.user.role === 'ADMIN' ? 'STAFF' : 'ADMIN'}
                </button>

                <button
                  onClick={() => banEmail(session.user.email)}
                  className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400"
                >
                  Ban Email
                </button>

                <button
                  onClick={() => unbanEmail(session.user.email)}
                  className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400"
                >
                  Unban Email
                </button>

                {session.banned ? (
                  <button
                    onClick={() => unbanIp(session.ip)}
                    className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400"
                  >
                    Unban IP
                  </button>
                ) : (
                  <button
                    onClick={() => banIp(session.ip)}
                    className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400"
                  >
                    Ban IP
                  </button>
                )}

                <button
                  onClick={() => kickSession(session.id)}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2"
                >
                  Kick
                </button>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-zinc-400">
              No sessions yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}