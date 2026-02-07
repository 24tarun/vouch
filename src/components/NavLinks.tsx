'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutMenuForm } from "@/components/SignOutMenuForm";

interface NavLinksProps {
    vouchCount?: number;
}

export function NavLinks({ vouchCount = 0 }: NavLinksProps) {
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", label: "Tasks" },
        { href: "/dashboard/stats", label: "Stats" },
        { href: "/dashboard/voucher", label: "Vouching", badge: vouchCount > 0 ? vouchCount : undefined },
        { href: "/dashboard", label: "TAS", isLogo: true },
        { href: "/dashboard/friends", label: "Network" },
        { href: "/dashboard/ledger", label: "Ledger" },
        { href: "/dashboard/settings", label: "Settings" },
    ];

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
                            className="shrink-0 flex items-center gap-2 whitespace-nowrap"
                            aria-label="TAS Home"
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
                        className={`text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-colors shrink-0 flex items-center gap-1.5 whitespace-nowrap ${isActive ? "text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
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
