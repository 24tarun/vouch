"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Task } from "../lib/types";
import { Button } from "./ui/button";

interface CollapsibleFutureListProps {
    tasks: Task[];
    renderTask: (task: Task) => ReactNode;
}

const DASHBOARD_FUTURE_OPEN_SESSION_KEY = "dashboard.future.open";

export function CollapsibleFutureList({ tasks, renderTask }: CollapsibleFutureListProps) {
    const [isOpen, setIsOpen] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        try {
            return window.sessionStorage.getItem(DASHBOARD_FUTURE_OPEN_SESSION_KEY) === "1";
        } catch {
            return false;
        }
    });

    if (tasks.length === 0) return null;

    const handleToggle = () => {
        setIsOpen((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                try {
                    if (next) {
                        window.sessionStorage.setItem(DASHBOARD_FUTURE_OPEN_SESSION_KEY, "1");
                    } else {
                        window.sessionStorage.removeItem(DASHBOARD_FUTURE_OPEN_SESSION_KEY);
                    }
                } catch {
                    // Ignore sessionStorage write failures.
                }
            }
            return next;
        });
    };

    return (
        <div className="mt-8" data-testid="future-accordion">
            <Button
                variant="ghost"
                onClick={handleToggle}
                className="group flex items-center gap-2 text-slate-400 hover:text-white px-0 hover:bg-transparent"
                aria-expanded={isOpen}
                aria-controls="dashboard-future-tasks-panel"
            >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium text-sm">Future</span>
            </Button>

            {isOpen && (
                <div className="mt-2" id="dashboard-future-tasks-panel">
                    <div className="flex flex-col">
                        {tasks.map((task) => renderTask(task))}
                    </div>
                </div>
            )}
        </div>
    );
}
