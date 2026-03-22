"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // Clear swipe direction after enter animation finishes
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
