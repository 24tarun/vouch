import type { Task } from "./types";

export interface DashboardActiveTaskBuckets {
    activeDueSoonTasks: Task[];
    futureTasks: Task[];
}

function getStartOfLocalDay(reference: Date): Date {
    const startOfDay = new Date(reference);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
}

export function getFutureTaskBoundaryLocal(reference: Date = new Date()): Date {
    const startOfToday = getStartOfLocalDay(reference);
    const startOfDayAfterTomorrow = new Date(startOfToday);
    startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 2);
    return startOfDayAfterTomorrow;
}

export function splitDashboardActiveTaskBuckets(
    activeTasks: Task[],
    reference: Date = new Date()
): DashboardActiveTaskBuckets {
    const futureBoundaryMs = getFutureTaskBoundaryLocal(reference).getTime();
    const activeDueSoonTasks: Task[] = [];
    const futureTasks: Task[] = [];

    for (const task of activeTasks) {
        const deadlineMs = Date.parse(task.deadline);

        // Invalid deadlines should remain visible in Active fallback.
        if (Number.isNaN(deadlineMs) || deadlineMs < futureBoundaryMs) {
            activeDueSoonTasks.push(task);
            continue;
        }

        futureTasks.push(task);
    }

    return { activeDueSoonTasks, futureTasks };
}
