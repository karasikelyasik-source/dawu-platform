'use client';

import { useState } from 'react';
import Button from './ui/Button';
import Container from './ui/Container';
import Section from './ui/Section';
import SectionTitle from './ui/SectionTitle';

export default function Reservation() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    guests: '2',
    date: '',
    time: '',
    message: '',
  });

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

async function submitReservation(e: React.FormEvent) {
  e.preventDefault();

  const res = await fetch('http://31.57.201.45:3000/public/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: form.name,
      phone: form.phone,
      email: form.email,
      guests: Number(form.guests),
      date: form.date,
      time: form.time,
      message: form.message,
    }),
  });

  if (!res.ok) {
    alert('Reservation could not be created.');
    return;
  }

  alert('Thank you! Your reservation has been received.');

  setForm({
    name: '',
    phone: '',
    email: '',
    guests: '2',
    date: '',
    time: '',
    message: '',
  });
}

  return (
    <Section id="reservation" className="bg-[#070504] text-white">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionTitle
            subtitle="Reservation"
            title="Reserve your table at DaWu."
            description="Book your table online. Our team will confirm your reservation as soon as possible."
          />

        <form
  onSubmit={submitReservation}
  className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur"
>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Name"
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
              />

              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Phone"
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
              />

              <input
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Email"
                type="email"
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
              />

              <input
                value={form.guests}
                onChange={(e) => updateField('guests', e.target.value)}
                placeholder="Guests"
                type="number"
                min="1"
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
              />

              <input
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                type="date"
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
              />

              <input
                value={form.time}
                onChange={(e) => updateField('time', e.target.value)}
                type="time"
                className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
              />
            </div>

            <textarea
              value={form.message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Special request"
              rows={5}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-amber-300"
            />

         <button
  type="submit"
  className="rounded-full bg-amber-300 px-9 py-5 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:scale-105"
>
  Reserve a Table
</button>
          </form>
        </div>
      </Container>
    </Section>
  );
}