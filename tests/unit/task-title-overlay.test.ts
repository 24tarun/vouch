import test from "node:test";
import assert from "node:assert/strict";
import { shouldRenderTaskTitleOverlay } from "../../src/lib/task-title-overlay.ts";

test("plain titles keep native input text visible", () => {
    /*
     * WHAT + WHY:
     * This checks the regression behind the caret bug: plain titles should not use the mirrored overlay.
     * When no syntax highlighting or completion ghost text exists, the native input text must remain visible so caret metrics match the rendered glyphs.
     *
     * PASSING SCENARIO:
     * A plain title with only default white segments returns false, so the component renders the native input text directly.
     *
     * FAILING SCENARIO:
     * If this returns true, the UI falls back to the overlay for ordinary text and the caret can drift into the middle of visible characters.
     */
    assert.equal(
        shouldRenderTaskTitleOverlay("Screen", [{ className: "text-white" }]),
        false
    );
});

test("highlighted or autocompleted titles still use the overlay", () => {
    /*
     * WHAT + WHY:
     * This preserves the feature that motivated the overlay in the first place: syntax-colored tokens and ghost completion text.
     * The overlay must still render when there is styled text or an inline completion suffix to show.
     *
     * PASSING SCENARIO:
     * Non-default color styling or a completion suffix returns true, so highlighting/autocomplete remains visible.
     *
     * FAILING SCENARIO:
     * If this returns false, event-token coloring disappears or completion suffixes stop rendering while the user types.
     */
    assert.equal(
        shouldRenderTaskTitleOverlay("plan -event", [{ className: "text-orange-400" }]),
        true
    );
    assert.equal(
        shouldRenderTaskTitleOverlay("pla", [{ className: "text-white" }], "n"),
        true
    );
});
