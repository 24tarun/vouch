"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingRedirect() {
    const router = useRouter();

    useEffect(() => {
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        router.replace(isMobile ? "/landing/mobile" : "/landing/desktop");
    }, [router]);

    return null;
}
