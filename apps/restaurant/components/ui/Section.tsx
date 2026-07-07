import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Section({
  children,
  className = '',
}: Props) {
  return (
    <section className={`py-28 ${className}`}>
      {children}
    </section>
  );
}