import { schedules } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/notifications";
import type { TaskStatus } from "@/lib/xstate/task-machine";

interface DeadlineWarningTask {
    id: string;
    title: string;
    deadline: string;
    status: TaskStatus;
    user: {
        id: string;
    } | null;
}

const PRE_REMINDER_EVENT = "DEADLINE_WARNING_2M";
const FINAL_REMINDER_EVENT = "DEADLINE_FINAL_REMINDER";
const ACTIVE_STATUSES: TaskStatus[] = ["CREATED", "POSTPONED"];

function toIso(date: Date): string {
    return date.toISOString();
}

async function loadExistingReminderTaskIds(
    taskIds: string[],
    eventType: string
): Promise<Set<string>> {
    if (taskIds.length === 0) return new Set();

    const supabase = createAdminClient();
    const { data } = await supabase
        .from("task_events")
        .select("task_id")
        .in("task_id", taskIds as any)
        .eq("event_type", eventType as any);

    return new Set(((data as Array<{ task_id: string }> | null) || []).map((row) => row.task_id));
}

async function sendReminderAndLogEvent(
    task: DeadlineWarningTask,
    eventType: string,
    title: string,
    body: string
) {
    const supabase = createAdminClient();

    await sendNotification({
        userId: task.user?.id,
        subject: title,
        title,
        text: body,
        email: false,
        push: true,
        url: `/dashboard/tasks/${task.id}`,
        tag: `${eventType.toLowerCase()}-${task.id}`,
        data: {
            taskId: task.id,
            kind: eventType,
            deadline: task.deadline,
        },
    });

    const taskEvents = supabase.from("task_events") as unknown as {
        insert: (values: {
            task_id: string;
            event_type: string;
            actor_id: string | null;
            from_status: TaskStatus;
            to_status: TaskStatus;
            metadata: Record<string, unknown>;
        }) => Promise<unknown>;
    };

    await taskEvents.insert({
        task_id: task.id,
        event_type: eventType,
        actor_id: null,
        from_status: task.status,
        to_status: task.status,
        metadata: {
            task_title: task.title.trim(),
            deadline: task.deadline,
            body,
        },
    });
}

export const deadlineWarning = schedules.task({
    id: "deadline-warning",
    cron: "* * * * *",
    run: async () => {
        const supabase = createAdminClient();
        const now = new Date();
        const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        const nowIso = toIso(now);

        // Reminder 1: in the final 2 minutes before deadline.
        const twoMinuteResponse = await supabase
            .from("tasks")
            .select(`
                id,
                title,
                deadline,
                status,
                user:profiles!tasks_user_id_fkey(id)
            `)
            .in("status", ACTIVE_STATUSES as any)
            .gt("deadline", nowIso)
            .lte("deadline", toIso(twoMinutesFromNow));

        if (twoMinuteResponse.error) {
            console.error("Error fetching tasks for two-minute deadline warnings:", twoMinuteResponse.error);
        } else {
            const tasks = (twoMinuteResponse.data || []) as unknown as DeadlineWarningTask[];
            const taskIds = tasks.map((task) => task.id);
            const alreadyWarnedTaskIds = await loadExistingReminderTaskIds(taskIds, PRE_REMINDER_EVENT);

            for (const task of tasks) {
                if (!task.user?.id) continue;
                if (alreadyWarnedTaskIds.has(task.id)) continue;

                await sendReminderAndLogEvent(
                    task,
                    PRE_REMINDER_EVENT,
                    "Task deadline in 2 minutes",
                    `2 minutes left for ${task.title}`
                );
            }
        }

        // Reminder 2: at deadline time (with one-minute scheduler tolerance).
        const finalReminderResponse = await supabase
            .from("tasks")
            .select(`
                id,
                title,
                deadline,
                status,
                user:profiles!tasks_user_id_fkey(id)
            `)
            .in("status", ACTIVE_STATUSES as any)
            .lte("deadline", nowIso)
            .gt("deadline", toIso(oneMinuteAgo));

        if (finalReminderResponse.error) {
            console.error("Error fetching tasks for final deadline reminders:", finalReminderResponse.error);
            return;
        }

        const finalReminderTasks = (finalReminderResponse.data || []) as unknown as DeadlineWarningTask[];
        const finalReminderTaskIds = finalReminderTasks.map((task) => task.id);
        const alreadyFinalRemindedTaskIds = await loadExistingReminderTaskIds(
            finalReminderTaskIds,
            FINAL_REMINDER_EVENT
        );

        for (const task of finalReminderTasks) {
            if (!task.user?.id) continue;
            if (alreadyFinalRemindedTaskIds.has(task.id)) continue;

            await sendReminderAndLogEvent(
                task,
                FINAL_REMINDER_EVENT,
                "Final reminder",
                `final reminder for ${task.title}`
            );
        }
    },
});
