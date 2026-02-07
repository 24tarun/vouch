import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TAS',
        short_name: 'TAS',
        description: 'Task Accountability System',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        categories: ['productivity', 'utilities'],
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Tasks',
                short_name: 'Tasks',
                description: 'Open your task inbox',
                url: '/dashboard',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
                name: 'Stats',
                short_name: 'Stats',
                description: 'Open your performance stats',
                url: '/dashboard/stats',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
                name: 'Vouching',
                short_name: 'Vouch',
                description: 'Review pending vouch requests',
                url: '/dashboard/voucher',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
        ],
    };
}
