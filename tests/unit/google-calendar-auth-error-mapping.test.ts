import test from "node:test";
import assert from "node:assert/strict";
import { mapGoogleAuthFailureToReconnectMessage } from "../../src/lib/google-calendar/sync.ts";

test("mapGoogleAuthFailureToReconnectMessage maps revoked-refresh-token errors to reconnect guidance", () => {
    /*
     * What and why this test checks:
     * Google token refresh can fail with revoked/expired grant text, and the UI should receive a clear reconnect instruction.
     *
     * Passing scenario:
     * An OAuth refresh error containing revoked-grant language maps to the reconnect message.
     *
     * Failing scenario:
     * If this mapping is absent, users only see vague refresh failures and do not know reconnect is required.
     */
    const message = mapGoogleAuthFailureToReconnectMessage(
        new Error("Token has been expired or revoked.")
    );

    assert.equal(
        message,
        "Google Calendar connection expired. Please disconnect and reconnect Google Calendar."
    );
});

test("mapGoogleAuthFailureToReconnectMessage keeps non-auth errors unmapped", () => {
    /*
     * What and why this test checks:
     * Only auth-expiry style failures should be rewritten; unrelated operational failures must preserve their original handling.
     *
     * Passing scenario:
     * A generic non-auth error returns null (no reconnect remap).
     *
     * Failing scenario:
     * If non-auth errors are remapped, troubleshooting information is lost behind an incorrect reconnect instruction.
     */
    const message = mapGoogleAuthFailureToReconnectMessage(
        new Error("Network timeout while loading calendars.")
    );

    assert.equal(message, null);
});
