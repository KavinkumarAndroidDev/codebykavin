import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About My Journey',
  description: 'Learn about Kavin, the developer behind CodeByKavin, and the mission to build innovative digital experiences.',
};

export default function AboutPage() {
  return <AboutClient />;
}
