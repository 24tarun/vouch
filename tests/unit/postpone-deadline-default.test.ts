import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultDeadlineDraftValue } from "../../src/components/PostponeDeadlineDialog";
import { toDateTimeLocalValue } from "../../src/lib/datetime-local";

test("postpone default uses current deadline plus one day when the existing deadline is valid", () => {
    const existingDeadlineIso = "2026-03-13T20:00:00.000Z";
    const expected = toDateTimeLocalValue(
        new Date(new Date(existingDeadlineIso).getTime() + 24 * 60 * 60 * 1000)
    );

    /*
     * What and why this test checks:
     * This verifies postpone defaults are anchored to the task's current deadline, not to the current clock time,
     * so users get a deterministic "same time next day" seed when opening the dialog.
     *
     * Passing scenario:
     * A valid existing deadline produces a default local datetime equal to existing deadline + 1 day.
     *
     * Failing scenario:
     * If the function returns now + 1 day (or any other base), the default no longer follows the intended
     * postpone-by-deadline behavior.
     */
    assert.equal(getDefaultDeadlineDraftValue(existingDeadlineIso), expected);
});

test("postpone default falls back to now plus one day when the existing deadline is missing or invalid", () => {
    const fixedNowMs = Date.UTC(2026, 2, 13, 14, 0, 0, 0);
    const originalDateNow = Date.now;
    Date.now = () => fixedNowMs;

    try {
        const expected = toDateTimeLocalValue(new Date(fixedNowMs + 24 * 60 * 60 * 1000));

        /*
         * What and why this test checks:
         * This verifies we still provide a valid default when no usable deadline exists, using now + 1 day as a
         * safe fallback to keep the input prefilled and future-valid.
         *
         * Passing scenario:
         * Missing/null or invalid deadline input resolves to a local datetime equal to mocked now + 1 day.
         *
         * Failing scenario:
         * If the fallback does not use current time + 1 day, users may get empty/incorrect defaults that do not
         * preserve expected postpone UX when task deadline data is absent or malformed.
         */
        assert.equal(getDefaultDeadlineDraftValue(null), expected);
        assert.equal(getDefaultDeadlineDraftValue("invalid-date"), expected);
    } finally {
        Date.now = originalDateNow;
    }
});
