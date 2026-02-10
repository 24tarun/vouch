"use client";

import { useMemo } from "react";
import type { Task } from "@/lib/types";
import { CompactStatsItem } from "@/components/CompactStatsItem";
import { TaskDetailPrefetcher } from "@/components/TaskDetailPrefetcher";

type StatsTask = Task & { pomo_total_seconds?: number };
const ACTIVE_SECTION_STATUSES = new Set(["CREATED", "POSTPONED", "AWAITING_VOUCHER", "MARKED_COMPLETED"]);

interface StatsActiveTaskListProps {
    initialTasks: StatsTask[];
}

export function StatsActiveTaskList({
    initialTasks,
}: StatsActiveTaskListProps) {
    const tasks = useMemo(
        () => initialTasks.filter((task) => ACTIVE_SECTION_STATUSES.has(task.status)),
        [initialTasks]
    );

    return (
        <>
            <TaskDetailPrefetcher tasks={tasks} />
            {tasks.map((task) => (
                <CompactStatsItem
                    key={task.id}
                    task={task}
                    forceActiveBadge
                />
            ))}
        </>
    );
}
