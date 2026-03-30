import type { Task } from "./types";
import type { TaskStatus } from "./xstate/task-machine";

const ACTIVE_PENDING_STATUS_SET = new Set<TaskStatus>(["ACTIVE", "POSTPONED"]);

export function canVoucherSeeTask(
    task: Pick<Task, "status" | "deadline"> & { user?: { voucher_can_view_active_tasks?: boolean } | null },
    reference: Date = new Date()
): boolean {
    if (!ACTIVE_PENDING_STATUS_SET.has(task.status)) return true;

    if (task.user?.voucher_can_view_active_tasks !== true) return false;
    const deadlineMs = Date.parse(task.deadline);
    if (Number.isNaN(deadlineMs)) return false;
    const now = reference.getTime();
    const startOfToday = new Date(reference);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    return deadlineMs >= startOfToday.getTime() && deadlineMs < startOfTomorrow.getTime();
}
