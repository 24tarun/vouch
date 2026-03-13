export type ProofRequestEventRow = {
    task_id?: string | null;
};

export function buildProofRequestCountByTaskId(rows: ProofRequestEventRow[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const taskId = typeof row.task_id === "string" ? row.task_id : null;
        if (!taskId) continue;
        counts.set(taskId, (counts.get(taskId) || 0) + 1);
    }
    return counts;
}
