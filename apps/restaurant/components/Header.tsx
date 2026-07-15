'use client';

import { FormEvent, useEffect, useState } from 'react';

type AuthMode = 'login' | 'register';

export default function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAuth();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [authOpen]);

  function openAuth(mode: AuthMode = 'login') {
    setAuthMode(mode);
    setMessage('');
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
    setMessage('');
  }

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setMessage('');
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      'The login interface is ready. Backend connection is the next step.',
    );
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setMessage(
      'The registration interface is ready. Backend connection is the next step.',
    );
  }

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          <a href="#" className="shrink-0">
            <div className="text-2xl font-black tracking-[0.3em] sm:text-3xl sm:tracking-[0.35em]">
              DAWU
            </div>

            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-zinc-400 sm:text-xs sm:tracking-[0.35em]">
              Sushi Fusion
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-bold uppercase tracking-[0.18em] text-zinc-300 md:flex">
            <a href="#menu" className="transition hover:text-white">
              Menu
            </a>

            <a href="#ayce" className="transition hover:text-white">
              All You Can Eat
            </a>

            <a href="#takeaway" className="transition hover:text-white">
              Take Away
            </a>

            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openAuth('login')}
              aria-label="Open customer account"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition hover:scale-105 hover:border-white/30 hover:bg-white/10"
            >
              <UserIcon />
            </button>

            <a
              href="#reservation"
              className="rounded-full bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-105 sm:px-7 sm:text-sm sm:tracking-[0.18em]"
            >
              Reserve
            </a>
          </div>
        </div>
      </header>

      {authOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] border border-white/10 bg-[#0d0b0a] p-6 shadow-2xl sm:rounded-[32px] sm:p-8">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                  DaWu Account
                </p>

                <h2 className="mt-3 text-3xl font-black text-white">
                  {authMode === 'login'
                    ? 'Welcome back.'
                    : 'Create your account.'}
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {authMode === 'login'
                    ? 'Log in to view reservations, orders and delivery history.'
                    : 'Create an account to keep all your DaWu activity in one place.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAuth}
                aria-label="Close account window"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-black p-1.5">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={[
                  'rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition',
                  authMode === 'login'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white',
                ].join(' ')}
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => switchMode('register')}
                className={[
                  'rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition',
                  authMode === 'register'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white',
                ].join(' ')}
              >
                Register
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={submitLogin} className="mt-6 space-y-4">
                <Field
                  label="Email"
                  type="email"
                  value={loginForm.email}
                  placeholder="your@email.com"
                  autoComplete="email"
                  onChange={(value) =>
                    setLoginForm((current) => ({
                      ...current,
                      email: value,
                    }))
                  }
                />

                <Field
                  label="Password"
                  type="password"
                  value={loginForm.password}
                  placeholder="Your password"
                  autoComplete="current-password"
                  onChange={(value) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: value,
                    }))
                  }
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-semibold text-amber-300 transition hover:text-amber-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-amber-300 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-amber-200"
                >
                  Log In
                </button>
              </form>
            ) : (
              <form onSubmit={submitRegister} className="mt-6 space-y-4">
                <Field
                  label="Name"
                  value={registerForm.name}
                  placeholder="Your full name"
                  autoComplete="name"
                  onChange={(value) =>
                    setRegisterForm((current) => ({
                      ...current,
                      name: value,
                    }))
                  }
                />

                <Field
                  label="Email"
                  type="email"
                  value={registerForm.email}
                  placeholder="your@email.com"
                  autoComplete="email"
                  onChange={(value) =>
                    setRegisterForm((current) => ({
                      ...current,
                      email: value,
                    }))
                  }
                />

                <Field
                  label="Phone"
                  type="tel"
                  value={registerForm.phone}
                  placeholder="+31..."
                  autoComplete="tel"
                  onChange={(value) =>
                    setRegisterForm((current) => ({
                      ...current,
                      phone: value,
                    }))
                  }
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Password"
                    type="password"
                    value={registerForm.password}
                    placeholder="Create password"
                    autoComplete="new-password"
                    onChange={(value) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: value,
                      }))
                    }
                  />

                  <Field
                    label="Confirm"
                    type="password"
                    value={registerForm.confirmPassword}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    onChange={(value) =>
                      setRegisterForm((current) => ({
                        ...current,
                        confirmPassword: value,
                      }))
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-amber-300 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-amber-200"
                >
                  Create Account
                </button>
              </form>
            )}

            {message && (
              <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
                {message}
              </div>
            )}

            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
              <AccountFeature title="Orders" />
              <AccountFeature title="Delivery" />
              <AccountFeature title="Reservations" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  placeholder,
  type = 'text',
  autoComplete,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>

      <input
        required
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300"
      />
    </label>
  );
}

function AccountFeature({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-xs font-bold uppercase tracking-[0.1em] text-zinc-400">
      {title}
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}