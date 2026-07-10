'use client';

import { useState } from 'react';
import Container from './ui/Container';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';

type ReservationForm = {
  name: string;
  phone: string;
  email: string;
  guests: string;
  date: string;
  time: string;
  message: string;
};

const INITIAL_FORM: ReservationForm = {
  name: '',
  phone: '',
  email: '',
  guests: '2',
  date: '',
  time: '',
  message: '',
};

export default function Reservation() {
  const [form, setForm] = useState<ReservationForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function updateField(
    field: keyof ReservationForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage('');
    setErrorMessage('');
  }

  async function submitReservation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          guests: Number(form.guests),
          date: form.date,
          time: form.time,
          message: form.message.trim() || undefined,
        }),
      });

      const responseBody = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          responseBody?.message &&
          typeof responseBody.message === 'string'
            ? responseBody.message
            : 'Reservation could not be created. Please try again.';

        throw new Error(message);
      }

      setSuccessMessage(
        'Thank you! Your reservation has been confirmed. Please check your email.',
      );

      setForm(INITIAL_FORM);
    } catch (error) {
      console.error('Reservation creation failed:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not connect to the server. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Section
      id="reservation"
      className="bg-[#070504] text-white"
    >
      <Container>
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionTitle
            subtitle="Reservation"
            title="Reserve your table at DaWu."
            description="Book your table online and receive your confirmation and QR code by email."
          />

          <form
            onSubmit={submitReservation}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(event) =>
                  updateField('name', event.target.value)
                }
                placeholder="Name"
                autoComplete="name"
                required
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                value={form.phone}
                onChange={(event) =>
                  updateField('phone', event.target.value)
                }
                placeholder="Phone"
                type="tel"
                autoComplete="tel"
                required
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                value={form.email}
                onChange={(event) =>
                  updateField('email', event.target.value)
                }
                placeholder="Email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                value={form.guests}
                onChange={(event) =>
                  updateField('guests', event.target.value)
                }
                placeholder="Guests"
                type="number"
                min="1"
                max="50"
                required
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                value={form.date}
                onChange={(event) =>
                  updateField('date', event.target.value)
                }
                type="date"
                required
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                value={form.time}
                onChange={(event) =>
                  updateField('time', event.target.value)
                }
                type="time"
                required
                disabled={isSubmitting}
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <textarea
              value={form.message}
              onChange={(event) =>
                updateField('message', event.target.value)
              }
              placeholder="Special request"
              rows={5}
              disabled={isSubmitting}
              className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none transition focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {successMessage && (
              <div className="mt-5 rounded-2xl border border-green-700/50 bg-green-950/40 px-5 py-4 text-sm text-green-200">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-800/60 bg-red-950/40 px-5 py-4 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 rounded-full bg-amber-300 px-9 py-5 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:scale-105 hover:bg-amber-200 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
            >
              {isSubmitting
                ? 'Creating reservation...'
                : 'Reserve a Table'}
            </button>
          </form>
        </div>
      </Container>
    </Section>
  );
}