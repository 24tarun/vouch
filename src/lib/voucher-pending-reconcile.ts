interface PendingTaskIdentity {
    id: string;
}

export function reconcilePendingTasksFromServer<TTask extends PendingTaskIdentity>(
    serverPendingTasks: TTask[],
    suppressedPendingTaskIds: ReadonlySet<string>
): {
    pendingTasks: TTask[];
    suppressedPendingTaskIds: Set<string>;
} {
    if (serverPendingTasks.length === 0) {
        return {
            pendingTasks: [],
            suppressedPendingTaskIds: new Set<string>(),
        };
    }

    const visibleServerTaskIds = new Set(serverPendingTasks.map((task) => task.id));
    const nextSuppressedPendingTaskIds = new Set<string>();

    for (const taskId of suppressedPendingTaskIds) {
        if (visibleServerTaskIds.has(taskId)) {
            nextSuppressedPendingTaskIds.add(taskId);
        }
    }

    if (nextSuppressedPendingTaskIds.size === 0) {
        return {
            pendingTasks: serverPendingTasks,
            suppressedPendingTaskIds: nextSuppressedPendingTaskIds,
        };
    }

    return {
        pendingTasks: serverPendingTasks.filter((task) => !nextSuppressedPendingTaskIds.has(task.id)),
        suppressedPendingTaskIds: nextSuppressedPendingTaskIds,
    };
}
