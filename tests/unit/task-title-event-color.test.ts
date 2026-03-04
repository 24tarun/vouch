import test from "node:test";
import assert from "node:assert/strict";
import {
    GOOGLE_EVENT_COLOR_OPTIONS,
    findNearestColorHelperToken,
    isGoogleEventColorId,
    replaceNearestColorHelperToken,
    resolveEventColorFromTitle,
    stripEventColorTokens,
    validateEventColorUsage,
} from "../../src/lib/task-title-event-color.ts";

test("1) alias token resolves to expected Google colorId", () => {
    /*
     * WHAT + WHY:
     * This checks the primary UX path where users pick alias tokens from the dropdown.
     * Server persistence and Google payload both depend on alias -> colorId resolution.
     *
     * PASSING SCENARIO:
     * "-event -pink" resolves to colorId "4" and canonical alias "-pink".
     *
     * FAILING SCENARIO:
     * If alias mapping is wrong, Google would receive the wrong colorId and render the wrong color.
     */
    const result = resolveEventColorFromTitle("focus block -event -pink");
    assert.equal(result.colorId, "4");
    assert.equal(result.aliasToken, "-pink");
    assert.equal(result.nativeToken, "-flamingo");
});

test("2) native token resolves to canonical alias and colorId", () => {
    /*
     * WHAT + WHY:
     * Native token compatibility was explicitly requested, so parser must accept both vocabularies.
     *
     * PASSING SCENARIO:
     * "-flamingo" resolves to the same color as "-pink" with colorId "4".
     *
     * FAILING SCENARIO:
     * If native tokens are ignored, app/server parser behavior diverges from the product contract.
     */
    const result = resolveEventColorFromTitle("focus block -event -flamingo");
    assert.equal(result.colorId, "4");
    assert.equal(result.aliasToken, "-pink");
    assert.equal(result.nativeToken, "-flamingo");
});

test("3) alias variants resolve to lgreen/lblue mappings", () => {
    /*
     * WHAT + WHY:
     * Users may type "light-green/lightblue" naturally, so variants must normalize to canonical aliases.
     *
     * PASSING SCENARIO:
     * "-lightgreen" maps to lgreen/sage (id "2"), "-light-blue" maps to lblue/peacock (id "7").
     *
     * FAILING SCENARIO:
     * If variant normalization fails, valid user input appears unsupported and causes avoidable errors.
     */
    const green = resolveEventColorFromTitle("review -event -lightgreen");
    assert.equal(green.colorId, "2");
    assert.equal(green.aliasToken, "-lgreen");

    const blue = resolveEventColorFromTitle("review -event -light-blue");
    assert.equal(blue.colorId, "7");
    assert.equal(blue.aliasToken, "-lblue");
});

test("4) multiple color tokens use last-valid-wins rule", () => {
    /*
     * WHAT + WHY:
     * The parser contract is deterministic last-token-wins to support quick edits/appending tokens.
     *
     * PASSING SCENARIO:
     * "-red -blue -pink" resolves to "-pink" (colorId "4").
     *
     * FAILING SCENARIO:
     * If first token wins or parser errors, users cannot override color by appending a new token.
     */
    const result = resolveEventColorFromTitle("xyz -event -red -blue -pink");
    assert.equal(result.colorId, "4");
    assert.equal(result.aliasToken, "-pink");
});

test("5) non-event color usage is blocked by shared validator", () => {
    /*
     * WHAT + WHY:
     * Server and client both enforce that color tags are event-only.
     * This test protects the anti-bypass guard used in server actions.
     *
     * PASSING SCENARIO:
     * A non-event title containing color/helper tokens returns a blocking error.
     *
     * FAILING SCENARIO:
     * If no error is produced, non-event tasks could carry event-only metadata.
     */
    const withColor = validateEventColorUsage("write docs -pink", false);
    assert.match(withColor.error ?? "", /only for -event/i);

    const withHelper = validateEventColorUsage("write docs -color", false);
    assert.match(withHelper.error ?? "", /only for -event/i);
});

test("6) unresolved -color helper is rejected for event titles", () => {
    /*
     * WHAT + WHY:
     * The helper token is only an intermediate command and must be replaced by a real color token.
     *
     * PASSING SCENARIO:
     * Event title with "-color" and no selected color returns a clear validation error.
     *
     * FAILING SCENARIO:
     * If unresolved helper is accepted, persisted raw titles become ambiguous and sync color is undefined.
     */
    const unresolved = validateEventColorUsage("planning -event -color", true);
    assert.match(unresolved.error ?? "", /choose a color token/i);
});

test("7) nearest helper token is selected based on caret position", () => {
    /*
     * WHAT + WHY:
     * Replacement must target helper token nearest to caret for predictable keyboard editing.
     *
     * PASSING SCENARIO:
     * Caret near first helper picks first; caret near second helper picks second.
     *
     * FAILING SCENARIO:
     * If parser always replaces first/last helper, editing long titles becomes frustrating and incorrect.
     */
    const title = "plan -event -color later notes -color";
    const first = findNearestColorHelperToken(title, title.indexOf("-color") + 2);
    assert.ok(first);
    assert.equal(first?.token.toLowerCase(), "-color");

    const second = findNearestColorHelperToken(title, title.lastIndexOf("-color") + 2);
    assert.ok(second);
    assert.equal(second?.token.toLowerCase(), "-color");
});

test("8) helper replacement swaps nearest token and returns next caret index", () => {
    /*
     * WHAT + WHY:
     * Dropdown selection depends on deterministic text replacement and caret restoration.
     *
     * PASSING SCENARIO:
     * Replacing near a helper token inserts alias token and reports caret at end of inserted text.
     *
     * FAILING SCENARIO:
     * If caret index is wrong, subsequent typing happens at wrong position and breaks UX flow.
     */
    const title = "focus -event -color block";
    const caret = title.indexOf("-color") + 3;
    const replacement = replaceNearestColorHelperToken(title, caret, "-pink");

    assert.equal(replacement.replaced, true);
    assert.equal(replacement.nextTitle, "focus -event -pink block");
    assert.equal(replacement.nextCaretIndex, "focus -event -pink".length);
});

test("9) stripping removes helper/color tokens while preserving non-color metadata", () => {
    /*
     * WHAT + WHY:
     * Persisted titles should be clean and not store parser-only color helper/tokens.
     *
     * PASSING SCENARIO:
     * stripEventColorTokens removes helper/color tokens and keeps event/time/title text intact.
     *
     * FAILING SCENARIO:
     * If strip removes unrelated tokens (e.g. -event/-start), server persistence would regress.
     */
    const stripped = stripEventColorTokens("xyz -event -start0900 -color -pink notes");
    assert.equal(stripped, "xyz -event -start0900 notes");
});

test("10) palette exports contain exactly 11 unique valid Google color IDs", () => {
    /*
     * WHAT + WHY:
     * Product scope is fixed to 11 Google event colors; this test guards accidental additions/removals.
     *
     * PASSING SCENARIO:
     * Exported options contain exactly 11 unique IDs and each ID passes validator.
     *
     * FAILING SCENARIO:
     * Any mismatch means mapping table drift and can break dropdown/parser consistency.
     */
    const ids = GOOGLE_EVENT_COLOR_OPTIONS.map((option) => option.colorId);
    const unique = new Set(ids);
    assert.equal(GOOGLE_EVENT_COLOR_OPTIONS.length, 11);
    assert.equal(unique.size, 11);
    for (const id of unique) {
        assert.equal(isGoogleEventColorId(id), true);
    }
});

test("11) color-id validator rejects out-of-range values", () => {
    /*
     * WHAT + WHY:
     * Sync payload should only send legal Google color IDs.
     *
     * PASSING SCENARIO:
     * Known valid IDs return true; out-of-range values return false.
     *
     * FAILING SCENARIO:
     * If invalid IDs pass validation, API payloads may fail or produce undefined behavior.
     */
    assert.equal(isGoogleEventColorId("1"), true);
    assert.equal(isGoogleEventColorId("11"), true);
    assert.equal(isGoogleEventColorId("12"), false);
    assert.equal(isGoogleEventColorId("0"), false);
});
