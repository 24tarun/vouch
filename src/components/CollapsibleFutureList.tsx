"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Task } from "../lib/types";
import { Button } from "./ui/button";

interface CollapsibleFutureListProps {
    tasks: Task[];
    renderTask: (task: Task) => ReactNode;
}

export function CollapsibleFutureList({ tasks, renderTask }: CollapsibleFutureListProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsidePointerDown = (event: MouseEvent | TouchEvent) => {
            const container = containerRef.current;
            if (!container) return;
            const target = event.target;
            if (!(target instanceof Node)) return;
            if (!container.contains(target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsidePointerDown);
        document.addEventListener("touchstart", handleOutsidePointerDown);

        return () => {
            document.removeEventListener("mousedown", handleOutsidePointerDown);
            document.removeEventListener("touchstart", handleOutsidePointerDown);
        };
    }, [isOpen]);

    if (tasks.length === 0) return null;

    return (
        <div ref={containerRef} className="mt-8" data-testid="future-accordion">
            <Button
                variant="ghost"
                onClick={() => setIsOpen((prev) => !prev)}
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
