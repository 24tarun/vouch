'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", label: "Tasks" },
        { href: "/dashboard/voucher", label: "Vouching" },
        { href: "/dashboard/friends", label: "Network" },
        { href: "/dashboard/ledger", label: "Ledger" },
    ];

    return (
        <div className="flex items-center gap-6 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide no-scrollbar">
            {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-colors shrink-0 ${isActive ? "text-white font-bold" : "text-slate-500 hover:text-white"
                            }`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </div>
    );
}
