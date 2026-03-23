import test from "node:test";
import assert from "node:assert/strict";
import { getTaskSubmissionWindowState } from "../../src/lib/task-submission-window.ts";

test("UI completion state is disabled before start time", () => {
    /*
     * What and why this test checks:
     * This verifies the UI-facing completion flag turns off the Mark Complete action before the start boundary.
     *
     * Passing scenario:
     * With now earlier than start and before deadline, completionBlocked is true.
     *
     * Failing scenario:
     * If completionBlocked is false here, completion controls may render enabled before the allowed start interval.
     */
    const state = getTaskSubmissionWindowState({
        startAtIso: "2026-03-23T10:00:00.000Z",
        deadlineIso: "2026-03-23T11:00:00.000Z",
        now: new Date("2026-03-23T09:30:00.000Z"),
    });

    assert.equal(state.beforeStart, true);
    assert.equal(state.completionBlocked, true);
});

test("UI completion state becomes enabled exactly at start time", () => {
    /*
     * What and why this test checks:
     * This ensures the completion control transitions to enabled at the exact start boundary, not after it.
     *
     * Passing scenario:
     * At the same timestamp as start and with future deadline, completionBlocked is false.
     *
     * Failing scenario:
     * If this remains blocked, UI controls would show disabled longer than the configured interval requires.
     */
    const atStartIso = "2026-03-23T10:00:00.000Z";
    const state = getTaskSubmissionWindowState({
        startAtIso: atStartIso,
        deadlineIso: "2026-03-23T11:00:00.000Z",
        now: new Date(atStartIso),
    });

    assert.equal(state.beforeStart, false);
    assert.equal(state.completionBlocked, false);
});

test("UI completion state is disabled at or after deadline", () => {
    /*
     * What and why this test checks:
     * This confirms completion controls remain disabled once the submission interval has ended.
     *
     * Passing scenario:
     * When now is exactly deadline, pastDeadline is true and completionBlocked is true.
     *
     * Failing scenario:
     * If completionBlocked is false after deadline, the UI can incorrectly permit late submission actions.
     */
    const deadlineIso = "2026-03-23T11:00:00.000Z";
    const state = getTaskSubmissionWindowState({
        startAtIso: "2026-03-23T09:00:00.000Z",
        deadlineIso,
        now: new Date(deadlineIso),
    });

    assert.equal(state.pastDeadline, true);
    assert.equal(state.completionBlocked, true);
});
