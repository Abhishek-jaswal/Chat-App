'use client';
import './globals.css';
import { Patrick_Hand } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';

const patrickHand = Patrick_Hand({
  weight: '400',
  style: 'normal',
  subsets: ['latin'],
  variable: '--font-patrick-hand',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={patrickHand.variable}>
      <body className="font-[var(--font-patrick-hand)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
