'use client';

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOutMenuForm } from "@/components/SignOutMenuForm";
import { haptics } from "@/lib/haptics";

interface NavLinksProps {
    vouchCount?: number;
}

interface NetworkInformationLike {
    saveData?: boolean;
    effectiveType?: string;
}

type IdleWindow = Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
};

export function NavLinks({ vouchCount = 0 }: NavLinksProps) {
    const pathname = usePathname();
    const router = useRouter();
    const prefetchedHrefsRef = useRef<Set<string>>(new Set());

    const links = useMemo(
        () => [
            { href: "/dashboard", label: "Tasks" },
            { href: "/dashboard/stats", label: "Stats" },
            { href: "/dashboard/voucher", label: "Vouching", badge: vouchCount > 0 ? vouchCount : undefined },
            { href: "/dashboard", label: "TAS", isLogo: true },
            { href: "/dashboard/friends", label: "Network" },
            { href: "/dashboard/ledger", label: "Ledger" },
            { href: "/dashboard/settings", label: "Settings" },
        ],
        [vouchCount]
    );

    const prefetchLink = useCallback(
        (href: string) => {
            if (prefetchedHrefsRef.current.has(href)) return;
            prefetchedHrefsRef.current.add(href);
            void router.prefetch(href);
        },
        [router]
    );

    useEffect(() => {
        const idleWindow = window as IdleWindow;
        const uniqueHrefs = [...new Set(links.map((link) => link.href))];
        const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
        const isConstrainedNetwork =
            Boolean(connection?.saveData) ||
            connection?.effectiveType === "slow-2g" ||
            connection?.effectiveType === "2g";
        const hrefsToWarm = isConstrainedNetwork ? uniqueHrefs.slice(0, 3) : uniqueHrefs;
        let cancelled = false;
        let timeoutId: number | null = null;
        let idleId: number | null = null;

        const warmup = () => {
            hrefsToWarm.forEach((href, index) => {
                window.setTimeout(() => {
                    if (cancelled) return;
                    prefetchLink(href);
                }, index * 120);
            });
        };

        if (idleWindow.requestIdleCallback) {
            idleId = idleWindow.requestIdleCallback(warmup, { timeout: 1200 });
        } else {
            timeoutId = window.setTimeout(warmup, 220);
        }

        return () => {
            cancelled = true;
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            if (idleId !== null && idleWindow.cancelIdleCallback) {
                idleWindow.cancelIdleCallback(idleId);
            }
        };
    }, [links, prefetchLink]);

    return (
        <div className="w-full overflow-x-auto no-scrollbar scrollbar-hide">
            <div className="w-max min-w-full mx-auto flex items-center justify-center gap-6 px-2">
                {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                if (link.isLogo) {
                    return (
                        <Link
                            key={`logo-${link.label}`}
                            href={link.href}
                            prefetch
                            className="shrink-0 flex items-center gap-2 whitespace-nowrap"
                            aria-label="TAS Home"
                            onMouseEnter={() => prefetchLink(link.href)}
                            onFocus={() => prefetchLink(link.href)}
                            onTouchStart={() => prefetchLink(link.href)}
                            onClick={() => haptics.light()}
                        >
                            <div className="h-7 w-7 rounded bg-slate-200 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-900 leading-none">TAS</span>
                            </div>
                            <span className="text-base font-bold tracking-tight text-white">TAS</span>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        prefetch
                        className={`text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-colors shrink-0 flex items-center gap-1.5 whitespace-nowrap ${isActive ? "text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
                        onMouseEnter={() => prefetchLink(link.href)}
                        onFocus={() => prefetchLink(link.href)}
                        onTouchStart={() => prefetchLink(link.href)}
                        onClick={() => haptics.light()}
                    >
                        {link.label}
                        {link.badge !== undefined && (
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-slate-950">
                                {link.badge}
                            </span>
                        )}
                    </Link>
                );
                })}

                <SignOutMenuForm variant="nav" />
            </div>
        </div>
    );
}
