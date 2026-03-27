import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apps | CodeByKavin',
  description: 'Browse apps, experiments, and tools built by Kavin.',
};

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
