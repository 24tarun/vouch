import test from "node:test";
import assert from "node:assert/strict";
import {
    appendStatusToMobileReturnUrl,
    isGoogleMobileTokenQueryFallbackEnabled,
    isSafeMobileReturnUrl,
} from "../../src/lib/google-calendar/mobile-oauth.ts";

test("isSafeMobileReturnUrl allows only vouch:// deep links", () => {
    assert.equal(isSafeMobileReturnUrl("vouch://settings/calendar"), true);
    assert.equal(isSafeMobileReturnUrl("https://tas.tarunh.com/settings"), false);
    assert.equal(isSafeMobileReturnUrl("javascript:alert(1)"), false);
});

test("appendStatusToMobileReturnUrl appends status with query-safe encoding", () => {
    assert.equal(
        appendStatusToMobileReturnUrl("vouch://settings/calendar", "connected"),
        "vouch://settings/calendar?status=connected"
    );
    assert.equal(
        appendStatusToMobileReturnUrl("vouch://settings/calendar?foo=1", "invalid_state"),
        "vouch://settings/calendar?foo=1&status=invalid_state"
    );
});

test("isGoogleMobileTokenQueryFallbackEnabled defaults to true and obeys explicit falsey values", () => {
    const original = process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK;

    delete process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK;
    assert.equal(isGoogleMobileTokenQueryFallbackEnabled(), true);

    process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK = "false";
    assert.equal(isGoogleMobileTokenQueryFallbackEnabled(), false);

    process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK = "off";
    assert.equal(isGoogleMobileTokenQueryFallbackEnabled(), false);

    process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK = "1";
    assert.equal(isGoogleMobileTokenQueryFallbackEnabled(), true);

    if (original === undefined) {
        delete process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK;
    } else {
        process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK = original;
    }
});
