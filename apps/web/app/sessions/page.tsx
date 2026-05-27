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

type BanType = 'EMAIL' | 'IP';
type BanDuration = 'PERMANENT' | '1H' | '6H' | '24H' | '7D';

const API = 'http://31.57.201.45:3000';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [banType, setBanType] = useState<BanType>('EMAIL');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<BanDuration>('PERMANENT');

  async function loadSessions() {
    const res = await fetch(`${API}/admin-sessions`);
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
  }

  function getExpiresAt() {
    if (duration === 'PERMANENT') return null;

    const date = new Date();

    if (duration === '1H') date.setHours(date.getHours() + 1);
    if (duration === '6H') date.setHours(date.getHours() + 6);
    if (duration === '24H') date.setHours(date.getHours() + 24);
    if (duration === '7D') date.setDate(date.getDate() + 7);

    return date.toISOString();
  }

  function openBanModal(session: Session) {
    setSelectedSession(session);
    setBanType('EMAIL');
    setReason('');
    setDuration('PERMANENT');
    setBanModalOpen(true);
  }

  async function confirmBan() {
    if (!selectedSession) return;

    const value =
      banType === 'EMAIL'
        ? selectedSession.user.email
        : selectedSession.ip;

    if (!value) return;

    await fetch(`${API}/admin-sessions/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: banType,
        value,
        reason: reason || 'No reason provided',
        expiresAt: getExpiresAt(),
      }),
    });

    setBanModalOpen(false);
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
                  onClick={() => openBanModal(session)}
                  className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400"
                >
                  Ban
                </button>

                <button
                  onClick={() => unbanEmail(session.user.email)}
                  className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400"
                >
                  Unban Email
                </button>

                <button
                  onClick={() => unbanIp(session.ip)}
                  className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400"
                >
                  Unban IP
                </button>

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

      {banModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-2">Ban User</h2>

            <p className="text-zinc-400 mb-8">
              Choose how you want to block this user.
            </p>

            <div className="mb-6 rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <div className="font-bold">{selectedSession.user.email}</div>
              <div className="text-zinc-400 text-sm mt-1">
                IP: {selectedSession.ip || 'Unknown'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setBanType('EMAIL')}
                className={
                  banType === 'EMAIL'
                    ? 'rounded-xl bg-white text-black font-bold py-3'
                    : 'rounded-xl bg-zinc-900 border border-zinc-800 py-3'
                }
              >
                Ban by Email
              </button>

              <button
                onClick={() => setBanType('IP')}
                className={
                  banType === 'IP'
                    ? 'rounded-xl bg-white text-black font-bold py-3'
                    : 'rounded-xl bg-zinc-900 border border-zinc-800 py-3'
                }
              >
                Ban by IP
              </button>
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ban reason..."
              className="w-full h-28 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 outline-none mb-6"
            />

            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as BanDuration)}
              className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 outline-none mb-8"
            >
              <option value="PERMANENT">Permanent ban</option>
              <option value="1H">1 hour</option>
              <option value="6H">6 hours</option>
              <option value="24H">24 hours</option>
              <option value="7D">7 days</option>
            </select>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBanModalOpen(false)}
                className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-3"
              >
                Cancel
              </button>

              <button
                onClick={confirmBan}
                className="rounded-xl bg-red-500 text-white font-bold px-5 py-3"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}