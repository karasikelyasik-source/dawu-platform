import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary';
};

export default function Button({
  children,
  href = '#',
  variant = 'primary',
}: Props) {
  const classes =
    variant === 'primary'
      ? 'bg-amber-300 text-black hover:scale-105'
      : 'border border-white/30 text-white hover:bg-white hover:text-black';

  return (
    <a
      href={href}
      className={`inline-flex rounded-full px-9 py-5 text-sm font-black uppercase tracking-[0.2em] transition ${classes}`}
    >
      {children}
    </a>
  );
}