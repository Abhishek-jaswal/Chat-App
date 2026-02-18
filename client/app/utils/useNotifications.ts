'use client';
// useNotifications.ts — PWA notification hook
// Requests permission, sends via SW when app is backgrounded/closed

import { useCallback, useEffect } from 'react';
import { saveSettings } from './chatStorage';

export function useNotifications(fp: string | null) {

    // Request permission on mount (only once)
    useEffect(() => {
        if (!fp) return;
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
                if (fp) saveSettings(fp, { notificationsGranted: perm === 'granted' });
            });
        }
    }, [fp]);

    const sendNotification = useCallback(
        (title: string, body: string, icon = '/chatapp.png', tag?: string) => {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;

            // If PWA service worker is active, use it for richer notifications
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title,
                    body,
                    icon,
                    tag: tag || title,
                    data: { url: window.location.href },
                });
            } else {
                // Fallback: direct Notification API
                try {
                    const n = new Notification(title, {
                        body,
                        icon,
                        tag: tag || title,
                        badge: '/chatapp.png',
                    });
                    n.onclick = () => { window.focus(); n.close(); };
                } catch { }
            }
        },
        []
    );

    // Only fire notification when tab/app is NOT in focus
    const notifyIfHidden = useCallback(
        (title: string, body: string, tag?: string) => {
            if (document.visibilityState === 'hidden' || !document.hasFocus()) {
                sendNotification(title, body, '/chatapp.png', tag);
            }
        },
        [sendNotification]
    );

    return { notifyIfHidden, sendNotification };
}
