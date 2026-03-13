import test from "node:test";
import assert from "node:assert/strict";
import { buildProofRequestCountByTaskId } from "../../src/actions/voucher";

test("proof request count aggregation groups PROOF_REQUESTED rows by task id", () => {
    const rows = [
        { task_id: "task-a" },
        { task_id: "task-b" },
        { task_id: "task-a" },
        { task_id: null },
        {},
    ];

    const counts = buildProofRequestCountByTaskId(rows);

    /*
     * What and why this test checks:
     * This verifies the pending-task proof-request counter is derived from task-event rows by
     * task id, so each voucher row can show an accurate lifetime `?N` value.
     *
     * Passing scenario:
     * task-a resolves to 2, task-b resolves to 1, and malformed rows without a valid task id are ignored.
     *
     * Failing scenario:
     * If grouping is wrong or invalid rows are counted, the voucher UI can show incorrect `?N` badges.
     */
    assert.equal(counts.get("task-a"), 2);
    assert.equal(counts.get("task-b"), 1);
    assert.equal(counts.has(""), false);
});

test("proof request count defaults to zero for task ids absent from the grouped map", () => {
    const counts = buildProofRequestCountByTaskId([{ task_id: "task-a" }]);

    /*
     * What and why this test checks:
     * This verifies the no-events path remains deterministic for mapping code that reads
     * `Map.get(task.id) || 0`, which should produce zero for tasks with no proof requests.
     *
     * Passing scenario:
     * Looking up an unseen task id returns undefined in the map, enabling the caller fallback to 0.
     *
     * Failing scenario:
     * If unseen task ids receive non-zero values, rows without requests could incorrectly display a `?N` badge.
     */
    assert.equal(counts.get("task-missing"), undefined);
});
