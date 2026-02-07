"use client";

import { useState } from "react";
import { ArrowUpDown, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showSampleNotification } from "@/lib/client-notifications";

export function DashboardHeaderActions() {
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
        </div>
    );
}
