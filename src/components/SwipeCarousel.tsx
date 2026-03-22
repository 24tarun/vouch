"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { haptics } from "@/lib/haptics";

const AXIS_LOCK_PX = 8;
const SWIPE_DISTANCE_RATIO = 0.16;
const SWIPE_DISTANCE_MAX_PX = 84;
const SWIPE_VELOCITY_PX_PER_SECOND = 320;
const FIRST_SWIPE_PREFETCH_WAIT_MS = 120;

const PAGES = [
    "/dashboard",
    "/dashboard/stats",
    "/dashboard/friends",
    "/dashboard/commitments",
    "/dashboard/ledger",
    "/dashboard/settings",
] as const;

type PagePath = (typeof PAGES)[number];

function Skeleton() {
    return (
        <div style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
            {[70, 45, 80, 50, 60].map((w, i) => (
                <div
                    key={i}
                    style={{
                        height: i === 0 ? 28 : 14,
                        width: `${w}%`,
                        background: "#1e293b",
                        borderRadius: 3,
                        opacity: 0.5,
                    }}
                />
            ))}
        </div>
    );
}

export function SwipeCarousel({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const widthRef = useRef(0);
    const isAnimating = useRef(false);
    const warmedPathsRef = useRef<Set<string>>(new Set());

    const x = useMotionValue(0);

    const idx = PAGES.indexOf(pathname as PagePath);
    const prevPath = idx > 0 ? PAGES[idx - 1] : null;
    const nextPath = idx < PAGES.length - 1 ? PAGES[idx + 1] : null;

    const warmPath = useCallback((path: string | null) => {
        if (!path) return true;
        const alreadyWarmed = warmedPathsRef.current.has(path);
        warmedPathsRef.current.add(path);
        router.prefetch(path);
        return alreadyWarmed;
    }, [router]);

    // Reset position on navigation.
    useEffect(() => {
        x.set(0);
        isAnimating.current = false;
    }, [pathname, x]);

    // Prefetch all dashboard pages once so swipe and navbar navigation are both warm.
    useEffect(() => {
        PAGES.forEach((path) => {
            warmPath(path);
        });
    }, [warmPath]);

    // Keep adjacent pages hot because these are the only swipe destinations.
    useEffect(() => {
        warmPath(prevPath);
        warmPath(nextPath);
    }, [nextPath, prevPath, warmPath]);

    // Track container width.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        widthRef.current = el.offsetWidth;
        const ro = new ResizeObserver(([entry]) => {
            widthRef.current = entry.contentRect.width;
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const prevContent = prevPath ? <Skeleton /> : null;
    const nextContent = nextPath ? <Skeleton /> : null;

    const snapTo = useCallback(
        async (dir: "prev" | "next") => {
            if (isAnimating.current) return;
            isAnimating.current = true;

            const w = widthRef.current || window.innerWidth;
            const target = dir === "prev" ? w : -w;
            const path = dir === "prev" ? prevPath : nextPath;
            const wasAlreadyWarmed = warmPath(path);

            await animate(x, target, {
                type: "spring",
                stiffness: 320,
                damping: 34,
                mass: 0.85,
            });

            haptics.light();
            if (path) {
                if (!wasAlreadyWarmed) {
                    await new Promise<void>((resolve) => {
                        window.setTimeout(resolve, FIRST_SWIPE_PREFETCH_WAIT_MS);
                    });
                }
                router.push(path);
            }
        },
        [nextPath, prevPath, router, warmPath, x],
    );

    const snapBack = useCallback(() => {
        animate(x, 0, { type: "spring", stiffness: 380, damping: 38 });
    }, [x]);

    // Touch gesture with manual axis lock so vertical scroll keeps working.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let sx = 0;
        let sy = 0;
        let st = 0;
        let hasHorizontalDrag = false;
        let axis: "h" | "v" | null = null;

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1 || isAnimating.current) return;
            const t = e.touches[0];
            sx = t.clientX;
            sy = t.clientY;
            st = Date.now();
            axis = null;
            hasHorizontalDrag = false;
            warmPath(prevPath);
            warmPath(nextPath);
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!st || isAnimating.current) return;
            const t = e.touches[0];
            const dx = t.clientX - sx;
            const dy = t.clientY - sy;

            if (axis === null) {
                if (Math.abs(dx) > AXIS_LOCK_PX || Math.abs(dy) > AXIS_LOCK_PX) {
                    axis = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
                }
                return;
            }

            if (axis === "v") return;

            // Confirmed horizontal gesture: prevent vertical scroll handoff.
            e.preventDefault();
            hasHorizontalDrag = true;

            const w = widthRef.current || window.innerWidth;
            let clamped = dx;

            // Rubber-band at boundaries.
            if (dx > 0 && !prevPath) clamped = dx * 0.1;
            if (dx < 0 && !nextPath) clamped = dx * 0.1;

            // Soft resist beyond 60% width.
            const cap = w * 0.6;
            if (Math.abs(clamped) > cap) {
                clamped = Math.sign(clamped) * (cap + (Math.abs(clamped) - cap) * 0.15);
            }

            x.set(clamped);
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (!st || isAnimating.current) return;

            const dx = e.changedTouches[0].clientX - sx;
            const dt = Math.max(1, Date.now() - st);
            const velocity = (dx / dt) * 1000;
            const w = widthRef.current || window.innerWidth;
            const minSwipeDistancePx = Math.min(w * SWIPE_DISTANCE_RATIO, SWIPE_DISTANCE_MAX_PX);

            if ((dx < -minSwipeDistancePx || velocity < -SWIPE_VELOCITY_PX_PER_SECOND) && nextPath) {
                snapTo("next");
            } else if ((dx > minSwipeDistancePx || velocity > SWIPE_VELOCITY_PX_PER_SECOND) && prevPath) {
                snapTo("prev");
            } else if (hasHorizontalDrag || Math.abs(dx) >= AXIS_LOCK_PX) {
                snapBack();
            }

            st = 0;
            axis = null;
            hasHorizontalDrag = false;
        };

        const onTouchCancel = () => {
            if (hasHorizontalDrag) {
                snapBack();
            }
            st = 0;
            axis = null;
            hasHorizontalDrag = false;
        };

        el.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
        el.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: true });

        return () => {
            el.removeEventListener("touchstart", onTouchStart, true);
            el.removeEventListener("touchmove", onTouchMove, true);
            el.removeEventListener("touchend", onTouchEnd, true);
            el.removeEventListener("touchcancel", onTouchCancel, true);
        };
    }, [nextPath, prevPath, snapBack, snapTo, warmPath, x]);

    // Slot transforms: previous/next are offset by container width around current x.
    const prevX = useTransform(x, (v) => v - (widthRef.current || window.innerWidth));
    const nextX = useTransform(x, (v) => v + (widthRef.current || window.innerWidth));

    return (
        // overflow-x: clip clips without creating a scroll container (unlike hidden),
        // so position:sticky inside pages still works.
        <div
            ref={containerRef}
            style={{ position: "relative", overflowX: "clip", touchAction: "pan-y" }}
        >
            {/* Left slot: previous page */}
            {prevContent && (
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        translateX: prevX,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    {prevContent}
                </motion.div>
            )}

            {/* Center slot: current page (in flow, sets container height) */}
            <motion.div style={{ translateX: x }}>
                {children}
            </motion.div>

            {/* Right slot: next page */}
            {nextContent && (
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        translateX: nextX,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    {nextContent}
                </motion.div>
            )}
        </div>
    );
}
