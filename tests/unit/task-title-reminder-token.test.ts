import test from "node:test";
import assert from "node:assert/strict";
import {
    buildTaskTitleHighlightSegments,
    getParserKeywordCompletion,
    parseReminderTimesFromTitle,
} from "../../src/lib/task-title-parser";

test("remind@ parser accepts hour-only and compact reminder times", () => {
    const parsed = parseReminderTimesFromTitle("deep work remind@20 remind@2200 remind@08");

    /*
     * What and why this test checks:
     * This verifies the new reminder token contract requested for TaskCreator: `remind@20`, `remind@2200`, and `remind@08`.
     * Reminder scheduling depends on these tokens parsing into deterministic hour/minute pairs.
     *
     * Passing scenario:
     * The parser returns [20:00, 22:00, 08:00] in the same order as title tokens.
     *
     * Failing scenario:
     * If hour-only or compact tokens are rejected, reminder creation silently drops expected reminders.
     */
    assert.deepEqual(parsed, [
        { hours: 20, minutes: 0 },
        { hours: 22, minutes: 0 },
        { hours: 8, minutes: 0 },
    ]);
});

test("legacy `remind <time>` syntax is no longer parsed", () => {
    const parsed = parseReminderTimesFromTitle("legacy remind 2200 remind 08:30");

    /*
     * What and why this test checks:
     * This enforces removal of the old reminder keyword behavior so the parser supports only `remind@...`.
     * Keeping both formats would violate the requested migration and create ambiguous UX.
     *
     * Passing scenario:
     * Space-separated legacy syntax produces zero parsed reminders.
     *
     * Failing scenario:
     * If legacy syntax still parses, users can keep using the deprecated format and behavior diverges from spec.
     */
    assert.equal(parsed.length, 0);
});

test("overlay highlighting and keyword completion align with remind@ format", () => {
    const highlightSegments = buildTaskTitleHighlightSegments("plan remind@2200");
    const completion = getParserKeywordCompletion("plan remi", "plan remi".length, []);

    /*
     * What and why this test checks:
     * This ensures visual and autocomplete behavior now follow the new reminder token syntax.
     * Users should see `remind@...` highlighted and get completion toward `remind@`, not deprecated `remind`.
     *
     * Passing scenario:
     * The highlight model marks `remind@2200` as a keyword segment and completion suggests `remind@`.
     *
     * Failing scenario:
     * If highlighting/completion still target old syntax, typing guidance in TaskCreator remains inconsistent.
     */
    assert.ok(
        highlightSegments.some(
            (segment) => segment.className === "text-orange-400" && segment.text.includes("remind@2200")
        )
    );
    assert.equal(completion?.insertText, "remind@");
});

