import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export default function Section({
  children,
  className = '',
  id,
}: Props) {
  return (
    <section id={id} className={`py-28 ${className}`}>
      {children}
    </section>
  );
}