import './globals.css';
import { Patrick_Hand } from 'next/font/google';
import Script from 'next/script';
import Providers from './components/Providers'; // ✅ import this
import InstallPrompt from './components/InstallPrompt';

const patrickHand = Patrick_Hand({
  weight: '400',
  style: 'normal',
  subsets: ['latin'],
  variable: '--font-patrick-hand',
});

export const metadata = {
  title: 'ChatApp',
  description: 'Real-time Chat Application',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#14b8a6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ChatApp',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={patrickHand.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChatApp" />
        <link rel="apple-touch-icon" href="/chatapp.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-[family-name:var(--font-patrick-hand)]">
        <Providers>{children}</Providers> {/* ✅ replaces SessionProvider */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('SW registered:', reg.scope))
                  .catch(err => console.error('SW error:', err));
              });
            }
          `}
        </Script>
        <InstallPrompt />
      </body>
    </html>
  );
}