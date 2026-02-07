import { schedules } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/notifications";
import type { TaskStatus } from "@/lib/xstate/task-machine";

interface VoucherDeadlineWarningTask {
    id: string;
    title: string;
    status: TaskStatus;
    voucher_response_deadline: string;
    voucher: {
        id: string;
        email: string;
        username: string | null;
    } | null;
}

export const voucherDeadlineWarning = schedules.task({
    id: "voucher-deadline-warning",
    cron: "*/15 * * * *",
    run: async () => {
        const supabase = createAdminClient();
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        const nowIso = now.toISOString();

        const response = await supabase
            .from("tasks")
            .select(`
                id,
                title,
                status,
                voucher_response_deadline,
                voucher:profiles!tasks_voucher_id_fkey(id, email, username)
            `)
            .eq("status", "AWAITING_VOUCHER")
            .gt("voucher_response_deadline", nowIso)
            .lt("voucher_response_deadline", oneHourFromNow);

        if (response.error) {
            console.error("Error fetching tasks for voucher deadline warning:", response.error);
            return;
        }

        const rows = (response.data || []) as unknown as VoucherDeadlineWarningTask[];
        console.log(`Found ${rows.length} tasks near voucher response deadline`);

        for (const task of rows) {
            const existingEventRes = await supabase
                .from("task_events")
                .select("id")
                .eq("task_id", task.id)
                .eq("event_type", "VOUCHER_DEADLINE_WARNING")
                .limit(1);

            if (existingEventRes.data && existingEventRes.data.length > 0) {
                continue;
            }

            if (task.voucher?.email) {
                await sendNotification({
                    to: task.voucher.email,
                    userId: task.voucher.id,
                    subject: `Less than 1 hour to approve task: ${task.title}`,
                    title: "Approval deadline in 1 hour",
                    text: `You have less than 1 hour to approve task: ${task.title}`,
                    html: `
                        <h1>Less than 1 hour to approve</h1>
                        <p>Hi ${task.voucher.username || "there"},</p>
                        <p>You have less than 1 hour to approve task: <strong>${task.title}</strong>.</p>
                        <p>Approval deadline: ${new Date(task.voucher_response_deadline).toLocaleString()}</p>
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/voucher">Review request</a></p>
                    `,
                    url: "/dashboard/voucher",
                    tag: `voucher-deadline-warning-${task.id}`,
                    data: { taskId: task.id, kind: "VOUCHER_DEADLINE_WARNING" },
                });
            }

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
                event_type: "VOUCHER_DEADLINE_WARNING",
                actor_id: null,
                from_status: task.status,
                to_status: task.status,
                metadata: { voucher_response_deadline: task.voucher_response_deadline },
            });
        }
    },
});
