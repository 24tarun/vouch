import test from "node:test";
import assert from "node:assert/strict";
import * as taskActionsModule from "../../src/actions/tasks";

const {
    canPostponeDailyRecurringTaskToDeadline,
    shouldRestrictDailyPostponeToSameRuleDay,
} = ((taskActionsModule as { default?: unknown }).default ?? taskActionsModule) as {
    canPostponeDailyRecurringTaskToDeadline: (
        currentDeadline: Date,
        newDeadline: Date,
        recurrenceTimeZone?: string | null
    ) => boolean;
    shouldRestrictDailyPostponeToSameRuleDay: (ruleConfig: unknown) => boolean;
};

test("daily recurrence allows postponing within the same rule-local day", () => {
    const currentDeadline = new Date("2026-03-24T09:00:00.000Z");
    const proposedDeadline = new Date("2026-03-24T18:30:00.000Z");

    /*
     * What and why this test checks:
     * This validates the daily-recurrence restriction still allows postponing when both timestamps fall on the
     * same calendar date in the recurrence timezone, so valid intra-day postpones are not blocked.
     *
     * Passing scenario:
     * The helper returns true for same-day daily recurrence postpone in the provided timezone.
     *
     * Failing scenario:
     * If this returns false, daily recurring tasks would be incorrectly blocked even for valid same-day updates.
     */
    assert.equal(
        canPostponeDailyRecurringTaskToDeadline(currentDeadline, proposedDeadline, "Europe/Berlin"),
        true
    );
});

test("daily recurrence blocks postponing into a different rule-local day", () => {
    const currentDeadline = new Date("2026-03-24T20:00:00.000Z");
    const proposedDeadline = new Date("2026-03-25T08:30:00.000Z");

    /*
     * What and why this test checks:
     * This validates the core safety rule: daily recurring tasks cannot be moved into the next local day, which
     * prevents overlap with the next generated daily iteration.
     *
     * Passing scenario:
     * The helper returns false when current/proposed deadlines land on different local dates.
     *
     * Failing scenario:
     * If this returns true, users could postpone daily tasks past day boundary and create duplicate-day iterations.
     */
    assert.equal(
        canPostponeDailyRecurringTaskToDeadline(currentDeadline, proposedDeadline, "America/Los_Angeles"),
        false
    );
});

test("timezone boundary allows postpone when UTC day changes but rule-local day is still the same", () => {
    const currentDeadline = new Date("2026-03-24T23:30:00.000Z");
    const proposedDeadline = new Date("2026-03-25T05:30:00.000Z");

    /*
     * What and why this test checks:
     * This verifies day comparison is done in recurrence timezone (not UTC), so midnight-crossing UTC timestamps
     * do not cause false rejections when the local rule day is unchanged.
     *
     * Passing scenario:
     * The helper returns true because both timestamps are still March 24 in America/Los_Angeles.
     *
     * Failing scenario:
     * If this returns false, the implementation is likely comparing UTC dates and would reject valid local-day postpones.
     */
    assert.equal(
        canPostponeDailyRecurringTaskToDeadline(currentDeadline, proposedDeadline, "America/Los_Angeles"),
        true
    );
});

test("non-daily recurrence does not activate the same-day postpone restriction", () => {
    /*
     * What and why this test checks:
     * This validates only DAILY frequency triggers the postpone day-boundary restriction; other recurrence types
     * must remain unaffected by this specific guard.
     *
     * Passing scenario:
     * WEEKLY returns false for restriction, while DAILY returns true for restriction.
     *
     * Failing scenario:
     * If WEEKLY returns true, non-daily tasks would be over-restricted; if DAILY returns false, the guard would not run.
     */
    assert.equal(shouldRestrictDailyPostponeToSameRuleDay({ frequency: "WEEKLY" }), false);
    assert.equal(shouldRestrictDailyPostponeToSameRuleDay({ frequency: "DAILY" }), true);
});

test("invalid or missing timezone falls back to UTC day comparison", () => {
    const currentDeadline = new Date("2026-03-24T23:30:00.000Z");
    const proposedDeadline = new Date("2026-03-25T00:30:00.000Z");

    /*
     * What and why this test checks:
     * This validates deterministic fallback behavior when recurrence timezone is missing/invalid, ensuring the
     * restriction still behaves consistently by comparing days in UTC.
     *
     * Passing scenario:
     * Both invalid timezone and missing timezone produce the same UTC-based result (false across UTC day boundary).
     *
     * Failing scenario:
     * If either case returns true, fallback is not using UTC comparison and daily boundary protection becomes inconsistent.
     */
    assert.equal(
        canPostponeDailyRecurringTaskToDeadline(currentDeadline, proposedDeadline, "Invalid/Timezone"),
        false
    );
    assert.equal(
        canPostponeDailyRecurringTaskToDeadline(currentDeadline, proposedDeadline, null),
        false
    );
});
