"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { invalidateClientCachesAndReload } from "@/lib/client-refresh";
import { cn } from "@/lib/utils";

interface HardRefreshButtonProps {
    className?: string;
    title?: string;
    ariaLabel?: string;
}

export function HardRefreshButton({
    className,
    title = "Hard refresh",
    ariaLabel = "Hard refresh",
}: HardRefreshButtonProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await invalidateClientCachesAndReload();
        } catch {
            setIsRefreshing(false);
            toast.error("Failed to perform hard refresh.");
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("text-slate-400 hover:text-white", className)}
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={ariaLabel}
            title={title}
            haptic="light"
        >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
    );
}

