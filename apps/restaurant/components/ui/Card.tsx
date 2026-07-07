import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function Card({
  children,
}: Props) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur transition hover:border-amber-300/40 hover:bg-white/[0.07]">
      {children}
    </div>
  );
}