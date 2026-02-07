"use client";

import { useState, useTransition } from "react";
import { ArrowUpDown, Bell, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showSampleNotification } from "@/lib/client-notifications";

export function DashboardHeaderActions() {
    const router = useRouter();
    const [isTestingNotification, setIsTestingNotification] = useState(false);
    const [isRefreshing, startRefreshTransition] = useTransition();

    const handleTestNotification = async () => {
        if (isTestingNotification) return;

        setIsTestingNotification(true);
        const result = await showSampleNotification();
        setIsTestingNotification(false);

        if (!result.success) {
            toast.error(result.message);
            return;
        }

        toast.success("Sample notification sent.");
    };

    const handleRefresh = () => {
        if (isRefreshing) return;
        startRefreshTransition(() => {
            router.refresh();
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" disabled>
                <ArrowUpDown className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
                onClick={handleTestNotification}
                disabled={isTestingNotification}
                aria-label="Test notification"
                title="Test notification"
                haptic="light"
            >
                <Bell className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                haptic="light"
            >
                <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
        </div>
    );
}
