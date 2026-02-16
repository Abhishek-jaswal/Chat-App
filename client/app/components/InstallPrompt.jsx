'use client';
import { useEffect, useState } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS (Safari doesn't fire beforeinstallprompt)
        const ios =
            /iphone|ipad|ipod/i.test(navigator.userAgent) &&
            !window.navigator.standalone;
        setIsIOS(ios);

        if (ios) {
            // Show iOS manual install tip after a short delay
            const timer = setTimeout(() => setShowBanner(true), 2000);
            return () => clearTimeout(timer);
        }

        // Android / Chrome — capture the install prompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setShowBanner(false);
        setDeferredPrompt(null);
    };

    if (isInstalled || !showBanner) return null;

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm
                    bg-white/15 backdrop-blur-md border border-white/20
                    rounded-2xl shadow-2xl p-4 text-white
                    font-[family-name:var(--font-patrick-hand)]
                    animate-fade-in">
            <button
                onClick={() => setShowBanner(false)}
                className="absolute top-2 right-3 text-white/60 hover:text-white text-lg leading-none"
                aria-label="Dismiss"
            >
                ✕
            </button>

            <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/chatapp.png" alt="ChatApp" className="w-10 h-10 rounded-xl" />
                <div>
                    <p className="font-bold text-base leading-tight">Install ChatApp</p>
                    <p className="text-xs text-gray-300">Get the full app experience</p>
                </div>
            </div>

            {isIOS ? (
                // iOS instructions (Safari Add to Home Screen)
                <p className="text-sm text-gray-200">
                    Tap the <span className="font-bold text-white">Share</span> button{' '}
                    <span className="text-base">⎋</span> then{' '}
                    <span className="font-bold text-white">&quot;Add to Home Screen&quot;</span>{' '}
                    <span className="text-base">➕</span> to install.
                </p>
            ) : (
                // Android / Chrome prompt
                <button
                    onClick={handleInstall}
                    className="w-full bg-teal-400 hover:bg-teal-500 text-black font-semibold
                     py-2 rounded-xl transition text-sm"
                >
                    📲 Add to Home Screen
                </button>
            )}
        </div>
    );
}