'use client';

import { useEffect } from 'react';

export function PWARegistration() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        let cancelled = false;

        const register = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                if (cancelled) return;

                // Ask the browser to check for updates early instead of waiting for a full page lifecycle.
                void registration.update();
                console.log('SW registered:', registration);
            } catch (err) {
                if (!cancelled) {
                    console.error('SW registration failed:', err);
                }
            }
        };

        void register();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
