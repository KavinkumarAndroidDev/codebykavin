import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://codebykavincms.netlify.app'),
  title: {
    default: 'CodeByKavin - Innovative Apps & Experiments',
    template: 'CodeByKavin | %s'
  },
  description: 'Explore a curated collection of experimental applications, productivity tools, and creative projects built by Kavin.',
  keywords: ['Kavin', 'CodeByKavin', 'Apps', 'Flutter', 'Next.js', 'Firebase', 'Portfolio'],
  authors: [{ name: 'Kavin' }],
  creator: 'Kavin',
  publisher: 'Kavin',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codebykavincms.netlify.app',
    siteName: 'CodeByKavin',
    title: 'CodeByKavin - Innovative Apps & Experiments',
    description: 'Explore a curated collection of experimental applications and creative projects.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CodeByKavin' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeByKavin',
    description: 'Innovative Apps & Experiments by Kavin.',
    creator: '@Kavin',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body suppressHydrationWarning className={`${inter.className} layout-wrapper min-h-screen flex flex-col`}>
        <AppProvider>
          <Navbar />
          <main className="main-content flex-grow w-full">
            <div className="layout-container">
              {children}
            </div>
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
