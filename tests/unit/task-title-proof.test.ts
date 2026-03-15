import test from "node:test";
import assert from "node:assert/strict";
import {
    buildTaskTitleHighlightSegments,
    getParserKeywordCompletion,
    parseProofRequiredFromTitle,
    stripProofRequiredTokens,
} from "../../src/lib/task-title-parser.ts";

test("proof parser token detection and stripping are deterministic", () => {
    const titleWithProof = "send update -proof tomorrow";
    const titleWithoutProof = "send update tomorrow";

    /*
     * What and why this test checks:
     * This validates the new parser helper contract for `-proof`, which drives server persistence and
     * title cleanup. If either detection or stripping drifts, UI and server can disagree on behavior.
     *
     * Passing scenario:
     * `-proof` is detected only when present, and stripping removes only the parser token while preserving user text.
     *
     * Failing scenario:
     * If detection misses `-proof` or stripping leaves the token behind, proof-required tasks can be created without enforcement
     * or parser syntax can leak into persisted task titles.
     */
    assert.equal(parseProofRequiredFromTitle(titleWithProof), true);
    assert.equal(parseProofRequiredFromTitle(titleWithoutProof), false);
    assert.equal(stripProofRequiredTokens(titleWithProof), "send update tomorrow");
    assert.equal(stripProofRequiredTokens("send update -proof"), "send update");
});

test("proof keyword participates in parser autocomplete and highlight model", () => {
    const completion = getParserKeywordCompletion("send update -proo", "send update -proo".length, []);
    const segments = buildTaskTitleHighlightSegments("send update -proof");

    /*
     * What and why this test checks:
     * This verifies `-proof` is wired into both parser UX paths users rely on while typing: inline completion and highlighted tokens.
     * Without this, the new keyword would work inconsistently compared with existing parser commands.
     *
     * Passing scenario:
     * Typing `-proo` suggests `-proof`, and a full `-proof` token is highlighted as a recognized parser keyword.
     *
     * Failing scenario:
     * If no suggestion appears or highlighting is missing, discoverability regresses and users receive misleading syntax feedback.
     */
    assert.equal(completion?.insertText, "-proof");
    assert.equal(completion?.suffix, "f");
    assert.ok(
        segments.some(
            (segment) => segment.className === "text-orange-400" && segment.text.includes("-proof")
        )
    );
});
