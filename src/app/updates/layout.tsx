import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Updates | CodeByKavin',
  description: 'See the latest releases and changelog highlights from CodeByKavin apps.',
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
