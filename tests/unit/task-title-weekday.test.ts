import test from "node:test";
import assert from "node:assert/strict";
import {
    extractWeekdayDateTokens,
    resolveUpcomingWeekdayDate,
} from "../../src/lib/task-title-weekday";

test("weekday parser recognizes short and long monday tokens", () => {
    const shortToken = extractWeekdayDateTokens("finish review mon");
    const longToken = extractWeekdayDateTokens("finish review monday");

    /*
     * What and why this test checks:
     * This verifies weekday keyword extraction accepts both shorthand (`mon`) and full-name (`monday`) inputs.
     * The TaskInput deadline parser relies on this extraction to auto-select the intended upcoming weekday.
     *
     * Passing scenario:
     * Both variants produce exactly one weekday match and map to weekday index `1` (Monday).
     *
     * Failing scenario:
     * If `mon` or `monday` is not recognized, typing those keywords would not auto-resolve the deadline date.
     */
    assert.equal(shortToken.length, 1);
    assert.equal(shortToken[0].weekday, 1);
    assert.equal(longToken.length, 1);
    assert.equal(longToken[0].weekday, 1);
});

test("upcoming monday from Saturday March 14, 2026 resolves to March 16, 2026", () => {
    const saturday = new Date(2026, 2, 14, 10, 30, 0, 0);
    const resolved = resolveUpcomingWeekdayDate(1, saturday);

    /*
     * What and why this test checks:
     * This validates the core product requirement: on Saturday (March 14, 2026), `mon`/`monday` must target the coming Monday.
     * It locks the exact calendar outcome expected by the user-reported scenario.
     *
     * Passing scenario:
     * Monday resolution from the given Saturday returns date components for March 16, 2026.
     *
     * Failing scenario:
     * If the resolver returns March 9 or March 23 (or any other date), weekday deadline auto-selection is incorrect.
     */
    assert.equal(resolved.getFullYear(), 2026);
    assert.equal(resolved.getMonth(), 2);
    assert.equal(resolved.getDate(), 16);
    assert.equal(resolved.getDay(), 1);
});

test("weekday resolution keeps same day when token matches today", () => {
    const monday = new Date(2026, 2, 16, 9, 0, 0, 0);
    const resolved = resolveUpcomingWeekdayDate(1, monday);

    /*
     * What and why this test checks:
     * This confirms the resolver uses the nearest upcoming match including today, which keeps behavior intuitive for same-day weekday input.
     * TaskInput then applies time validation separately if a user-entered time is already in the past.
     *
     * Passing scenario:
     * Resolving Monday while already on Monday returns the same calendar day.
     *
     * Failing scenario:
     * If it always jumps by 7 days, same-day weekday keywords would unexpectedly schedule one week later.
     */
    assert.equal(resolved.getFullYear(), 2026);
    assert.equal(resolved.getMonth(), 2);
    assert.equal(resolved.getDate(), 16);
    assert.equal(resolved.getDay(), 1);
});

