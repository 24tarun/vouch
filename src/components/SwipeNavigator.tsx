'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { haptics } from '@/lib/haptics';

const PAGES = [
    '/dashboard',
    '/dashboard/stats',
    '/dashboard/friends',
    '/dashboard/commitments',
    '/dashboard/ledger',
    '/dashboard/settings',
] as const;

// Minimum horizontal distance to trigger navigation
const SWIPE_PX = 52;
// Minimum velocity (px/ms) — fast flicks navigate even if short
const SWIPE_VEL = 0.35;
// Once vertical movement exceeds this, cancel horizontal swipe
const VERTICAL_CANCEL_PX = 12;

type SwipeDir = 'left' | 'right';

type DocumentWithViewTransition = Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function SwipeNavigator() {
    const router = useRouter();
    const pathname = usePathname();

    const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
    const axisLock = useRef<'horizontal' | 'vertical' | null>(null);
    // Store latest pathname in a ref so the event handler always sees current value
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;

    const navigate = useCallback(
        (dir: SwipeDir) => {
            const current = pathnameRef.current;

            // Only swipe-navigate from exact top-level pages
            const currentIdx = PAGES.indexOf(current as (typeof PAGES)[number]);
            if (currentIdx === -1) return;

            const nextIdx = dir === 'left' ? currentIdx + 1 : currentIdx - 1;
            if (nextIdx < 0 || nextIdx >= PAGES.length) return;

            const nextHref = PAGES[nextIdx];
            haptics.light();

            // Tag the html element so CSS knows slide direction
            document.documentElement.dataset.swipeDir = dir;

            const doc = document as DocumentWithViewTransition;
            if (doc.startViewTransition) {
                doc.startViewTransition(() => {
                    router.push(nextHref);
                });
            } else {
                router.push(nextHref);
            }
        },
        [router]
    );

    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
            axisLock.current = null;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!touchStart.current) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStart.current.x;
            const dy = t.clientY - touchStart.current.y;

            if (!axisLock.current) {
                if (Math.abs(dy) > VERTICAL_CANCEL_PX) {
                    axisLock.current = 'vertical';
                } else if (Math.abs(dx) > 8) {
                    axisLock.current = 'horizontal';
                }
            }
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current || axisLock.current !== 'horizontal') {
                touchStart.current = null;
                return;
            }

            const t = e.changedTouches[0];
            const dx = t.clientX - touchStart.current.x;
            const dt = Math.max(1, Date.now() - touchStart.current.t);
            const vel = Math.abs(dx) / dt;

            touchStart.current = null;
            axisLock.current = null;

            if (Math.abs(dx) >= SWIPE_PX || vel >= SWIPE_VEL) {
                navigate(dx < 0 ? 'left' : 'right');
            }
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [navigate]);

    return null;
}
