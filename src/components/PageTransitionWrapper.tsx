"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // New page has mounted — clear exit state so main is no longer hidden.
        // Then clear direction after enter animation finishes.
        delete document.documentElement.dataset.swipeExiting;

        const t = setTimeout(() => {
            delete document.documentElement.dataset.swipeDir;
        }, 350);
        return () => clearTimeout(t);
    }, [pathname]);

    return (
        <div key={pathname} className="page-swipe-enter">
            {children}
        </div>
    );
}
