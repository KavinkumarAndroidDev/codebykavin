import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | CodeByKavin',
  description: 'Learn more about Kavin, the developer behind CodeByKavin.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
