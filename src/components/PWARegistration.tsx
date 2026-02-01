'use client';

import { useEffect } from 'react';

export function PWARegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((reg) => {
                        console.log('SW registered:', reg);
                    })
                    .catch((err) => {
                        console.error('SW registration failed:', err);
                    });
            });
        }
    }, []);

    return null;
}
