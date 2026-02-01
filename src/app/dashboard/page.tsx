import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";
import { PushInitializer } from "@/components/PushInitializer";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // @ts-ignore
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id as any)
        .order("created_at", { ascending: false });

    // @ts-ignore
    const { data: vouchRequests } = await supabase
        .from("tasks")
        .select("*")
        .eq("voucher_id", user?.id as any)
        .eq("status", "AWAITING_VOUCHER");

    // Get ledger summary for current month
    const currentPeriod = new Date().toISOString().slice(0, 7);
    // @ts-ignore
    const { data: ledgerEntries } = await supabase
        .from("ledger_entries")
        .select("*")
        .eq("user_id", user?.id as any)
        .eq("period", currentPeriod);

    const totalFailureCost =
        (ledgerEntries as any)?.reduce((sum: number, entry: any) => sum + entry.amount_cents, 0) || 0;

    const activeTasks =
        (tasks as Task[])?.filter((t) =>
            ["CREATED", "POSTPONED"].includes(t.status)
        ) || [];

    const historyTasks =
        (tasks as Task[])?.filter((t) =>
            !["CREATED", "POSTPONED"].includes(t.status)
        ) || [];

    const completedCount = tasks?.filter((t: Task) => t.status === "COMPLETED").length || 0;

    return (
        <div className="space-y-8">
            <PushInitializer />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your tasks and accountability
                    </p>
                </div>
                <Link href="/dashboard/tasks/new">
                    <Button haptic="light" className="bg-slate-200 hover:bg-white text-slate-900 font-semibold border-none">
                        + New Task
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-3 flex flex-col justify-between h-full min-h-[60px]">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                            Active Tasks
                        </span>
                        <p className="text-2xl font-bold text-white leading-none">{activeTasks.length}</p>
                    </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-3 flex flex-col justify-between h-full min-h-[60px]">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                            Pending Vouches
                        </span>
                        <p className="text-2xl font-bold text-slate-200 leading-none">
                            {vouchRequests?.length || 0}
                        </p>
                    </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-3 flex flex-col justify-between h-full min-h-[60px]">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                            Completed
                        </span>
                        <p className="text-2xl font-bold text-emerald-400 leading-none">
                            {completedCount}
                        </p>
                    </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-3 flex flex-col justify-between h-full min-h-[60px]">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                            Monthly Total
                        </span>
                        <p className="text-2xl font-bold text-slate-200 leading-none">
                            €{(totalFailureCost / 100).toFixed(2)}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Vouch Requests Alert */}
            {vouchRequests && vouchRequests.length > 0 && (
                <Card className="bg-slate-800/20 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                            Vouch Requests Pending
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            You have {vouchRequests.length} task(s) waiting for your review
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/voucher">
                            <Button
                                haptic="medium"
                                variant="outline"
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                Review Now
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Active Tasks */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">🔥 Active Tasks</h2>
                {activeTasks.length === 0 ? (
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="py-8 text-center">
                            <p className="text-slate-400 mb-4">No active tasks</p>
                            <Link href="/dashboard/tasks/new">
                                <Button
                                    variant="outline"
                                    className="border-slate-600 text-slate-300"
                                >
                                    Create a task
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {activeTasks.map((task: Task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                )}
            </div>

            {/* Task History */}
            {historyTasks.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-slate-400 mb-4">📋 History</h2>
                    <div className="grid gap-2">
                        {historyTasks.map((task: Task) => (
                            <TaskCard key={task.id} task={task} variant="history" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskCard({ task, variant = "active" }: { task: Task; variant?: "active" | "history" }) {
    const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
        CREATED: { color: "bg-slate-700", icon: "🎯", label: "Active" },
        POSTPONED: { color: "bg-slate-800", icon: "⏸️", label: "Postponed" },
        MARKED_COMPLETED: { color: "bg-blue-900/50", icon: "⏳", label: "Waiting" },
        AWAITING_VOUCHER: { color: "bg-blue-900/50", icon: "⏳", label: "Waiting" },
        COMPLETED: { color: "bg-emerald-900/50 text-emerald-400", icon: "✅", label: "Accepted" },
        FAILED: { color: "bg-red-900/50 text-red-400", icon: "❌", label: "Denied / Failed" },
        RECTIFIED: { color: "bg-orange-900/50 text-orange-400", icon: "🔄", label: "Rectified" },
        SETTLED: { color: "bg-slate-800", icon: "📁", label: "Settled" },
        DELETED: { color: "bg-slate-800", icon: "🗑️", label: "Deleted" },
    };

    const config = statusConfig[task.status] || { color: "bg-slate-700", icon: "❓", label: task.status };
    const deadline = new Date(task.deadline);
    const isOverdue = deadline < new Date() && !["COMPLETED", "FAILED", "RECTIFIED", "SETTLED", "DELETED"].includes(task.status);

    const cardStyles = {
        active: "bg-slate-800/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60",
        history: "bg-slate-900/30 border-slate-800/50 opacity-70 hover:opacity-100",
    };

    return (
        <Link href={`/dashboard/tasks/${task.id}`}>
            <Card className={`${cardStyles[variant]} transition-all cursor-pointer`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{config.icon}</span>
                                <h3 className={`font-medium ${variant === "history" ? "text-slate-300" : "text-white"}`}>
                                    {task.title}
                                </h3>
                                <Badge className={`${config.color} text-white text-xs`}>
                                    {config.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                <span className={isOverdue ? "text-red-400" : ""}>
                                    {variant === "history" ? "Deadline:" : "Due:"} {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span>Stake: €{(task.failure_cost_cents / 100).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
