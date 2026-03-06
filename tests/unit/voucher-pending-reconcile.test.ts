import test from "node:test";
import assert from "node:assert/strict";
import { reconcilePendingTasksFromServer } from "../../src/lib/voucher-pending-reconcile";

function buildPendingTask(id: string, title: string) {
    return {
        id,
        title,
    };
}

test("stale server payload keeps an optimistically removed pending task hidden", () => {
    const staleServerTasks = [
        buildPendingTask("task-a", "Write summary"),
        buildPendingTask("task-b", "Ship fix"),
    ];

    const reconciled = reconcilePendingTasksFromServer(
        staleServerTasks,
        new Set(["task-a"])
    );

    /*
     * What and why this test checks:
     * This verifies the core flicker fix for the friends page: a stale refresh payload must not
     * reinsert a task that the client just optimistically accepted or denied.
     *
     * Passing scenario:
     * The suppressed task stays filtered out of pendingTasks, while the suppression set stays active
     * because the stale server payload still includes that old task id.
     *
     * Failing scenario:
     * If the stale payload is applied as-is, the just-resolved task briefly reappears in the list.
     */
    assert.deepEqual(
        reconciled.pendingTasks.map((task) => task.id),
        ["task-b"]
    );
    assert.deepEqual(
        Array.from(reconciled.suppressedPendingTaskIds),
        ["task-a"]
    );
});

test("fresh server payload clears suppression once the resolved task disappears upstream", () => {
    const freshServerTasks = [buildPendingTask("task-b", "Ship fix")];

    const reconciled = reconcilePendingTasksFromServer(
        freshServerTasks,
        new Set(["task-a"])
    );

    /*
     * What and why this test checks:
     * This confirms the suppression is only temporary and is released after the server catches up.
     *
     * Passing scenario:
     * When the latest server payload no longer contains the resolved task id, the visible pending list
     * matches server truth and the suppression set is emptied.
     *
     * Failing scenario:
     * If suppression is never cleared, unrelated future updates could keep hiding tasks incorrectly.
     */
    assert.deepEqual(
        reconciled.pendingTasks.map((task) => task.id),
        ["task-b"]
    );
    assert.equal(reconciled.suppressedPendingTaskIds.size, 0);
});
