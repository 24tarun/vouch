import test from "node:test";
import assert from "node:assert/strict";
import { shouldTreatGoogleRevocationFailureAsSuccess } from "../../src/lib/google-calendar/sync.ts";

test("shouldTreatGoogleRevocationFailureAsSuccess returns true for JSON invalid_token", () => {
    /*
     * What and why this test checks:
     * Google revoke can return a JSON body with `invalid_token` when the token is already unusable.
     * Disconnect should continue in that case so users can still forget local integration data.
     *
     * Passing scenario:
     * A 400 response with JSON `{ error: "invalid_token" }` is treated as success.
     *
     * Failing scenario:
     * If this case is not treated as success, disconnect and forget fails for already-revoked tokens.
     */
    const shouldIgnore = shouldTreatGoogleRevocationFailureAsSuccess(
        400,
        '{ "error": "invalid_token", "error_description": "Token is not revocable." }'
    );

    assert.equal(shouldIgnore, true);
});

test("shouldTreatGoogleRevocationFailureAsSuccess returns true for form-encoded invalid_token", () => {
    /*
     * What and why this test checks:
     * Some OAuth providers and proxies encode revocation errors as URL-encoded fields instead of JSON.
     * Parsing must handle that variant to keep disconnect behavior consistent.
     *
     * Passing scenario:
     * A 400 response with `error=invalid_token` in URL-encoded format is treated as success.
     *
     * Failing scenario:
     * If only JSON is handled, form-encoded invalid_token responses still break disconnect.
     */
    const shouldIgnore = shouldTreatGoogleRevocationFailureAsSuccess(
        400,
        "error=invalid_token&error_description=Token+is+not+revocable."
    );

    assert.equal(shouldIgnore, true);
});

test("shouldTreatGoogleRevocationFailureAsSuccess returns false for non-invalid_token failures", () => {
    /*
     * What and why this test checks:
     * Only already-invalid tokens should be ignored; real revocation failures must still surface.
     * This prevents silent masking of actionable OAuth errors.
     *
     * Passing scenario:
     * A non-`invalid_token` response is not treated as success.
     *
     * Failing scenario:
     * If all 400 failures are ignored, real misconfiguration or permission errors are hidden.
     */
    const shouldIgnore = shouldTreatGoogleRevocationFailureAsSuccess(
        400,
        '{ "error": "unauthorized_client", "error_description": "Client is not allowed." }'
    );

    assert.equal(shouldIgnore, false);
});
