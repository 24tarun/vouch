import test from "node:test";
import assert from "node:assert/strict";
import { MAX_POMO_DURATION_MINUTES } from "../../src/lib/constants.ts";
import {
    isValidPomoDurationMinutes,
    normalizePomoDurationMinutes,
    parseRequiredPomoFromTitle,
} from "../../src/lib/pomodoro.ts";

test("Pomodoro duration validation accepts only integers from 1 through 120", () => {
    /*
     * WHAT + WHY:
     * This test checks the shared duration validator that now backs Pomodoro start limits across UI
     * and server actions. If this guard regresses, different parts of the app could allow different caps.
     *
     * PASSING SCENARIO:
     * Integer minute values inside the allowed 1..120 range should return true, including the exact cap.
     *
     * FAILING SCENARIO:
     * Zero, values above the cap, or non-integers must return false so invalid sessions cannot be started.
     */
    assert.equal(isValidPomoDurationMinutes(1), true);
    assert.equal(isValidPomoDurationMinutes(MAX_POMO_DURATION_MINUTES), true);
    assert.equal(isValidPomoDurationMinutes(0), false);
    assert.equal(isValidPomoDurationMinutes(MAX_POMO_DURATION_MINUTES + 1), false);
    assert.equal(isValidPomoDurationMinutes(25.5), false);
});

test("normalizePomoDurationMinutes clamps legacy values above the cap but preserves valid defaults", () => {
    /*
     * WHAT + WHY:
     * This test checks normalization for previously saved profile defaults that may still exceed the new cap.
     * The UI should surface a safe capped value instead of falling back unpredictably or keeping an invalid one.
     *
     * PASSING SCENARIO:
     * Valid values stay unchanged, and a legacy value above 120 is clamped down to exactly 120.
     *
     * FAILING SCENARIO:
     * If normalization reset capped values to an unrelated fallback or left 180 untouched, default-start behavior
     * in task rows and task detail views would no longer match the enforced server limit.
     */
    assert.equal(normalizePomoDurationMinutes(45), 45);
    assert.equal(normalizePomoDurationMinutes(180), MAX_POMO_DURATION_MINUTES);
    assert.equal(normalizePomoDurationMinutes("bad-value"), 25);
});

test("parseRequiredPomoFromTitle accepts pomo 120 and rejects values above the cap", () => {
    /*
     * WHAT + WHY:
     * This test checks the task-title parser path for required Pomodoro minutes during task creation.
     * Without this, users could type a requirement above two hours and either create an invalid task or see silent mismatch.
     *
     * PASSING SCENARIO:
     * A title containing "pomo 120" should parse into a required Pomodoro value of exactly 120 with no error.
     *
     * FAILING SCENARIO:
     * A title containing "pomo 121" must return an error so creation is blocked instead of silently accepting too much time.
     */
    assert.deepEqual(parseRequiredPomoFromTitle("Write report pomo 120"), {
        requiredPomoMinutes: MAX_POMO_DURATION_MINUTES,
    });
    assert.deepEqual(parseRequiredPomoFromTitle("Write report"), {
        requiredPomoMinutes: null,
    });

    const overCap = parseRequiredPomoFromTitle("Write report pomo 121");
    assert.equal(overCap.requiredPomoMinutes, null);
    assert.equal(
        overCap.error,
        `Required Pomodoro minutes must be an integer between 1 and ${MAX_POMO_DURATION_MINUTES}.`
    );
});
