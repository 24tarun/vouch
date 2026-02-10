"use client";

import { useState } from "react";
import { ArrowUpDown, Bell, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showSampleNotification } from "@/lib/client-notifications";
import { HardRefreshButton } from "@/components/HardRefreshButton";

interface DashboardHeaderActionsProps {
    tipsVisible: boolean;
    onToggleTips: () => void;
    isTogglingTips: boolean;
}

export function DashboardHeaderActions({
    tipsVisible,
    onToggleTips,
    isTogglingTips,
}: DashboardHeaderActionsProps) {
    const [isTestingNotification, setIsTestingNotification] = useState(false);

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

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className={tipsVisible ? "text-yellow-400 hover:text-yellow-300" : "text-slate-500 hover:text-slate-200"}
                onClick={onToggleTips}
                disabled={isTogglingTips}
                aria-label={tipsVisible ? "Hide tips" : "Show tips"}
                title={tipsVisible ? "Hide tips" : "Show tips"}
                haptic="light"
            >
                <Lightbulb className="h-4 w-4" />
            </Button>

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

            <HardRefreshButton ariaLabel="Refresh dashboard" title="Refresh dashboard" />
        </div>
    );
}
