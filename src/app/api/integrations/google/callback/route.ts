import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    GOOGLE_OAUTH_MOBILE_RETURN_COOKIE,
    GOOGLE_OAUTH_STATE_COOKIE,
    GOOGLE_OAUTH_USER_ID_COOKIE,
} from "@/lib/google-calendar/constants";
import {
    appendStatusToMobileReturnUrl,
    consumeActiveGoogleMobileOAuthSessionByState,
    getGoogleMobileOAuthSessionByState,
    sidPrefix,
} from "@/lib/google-calendar/mobile-oauth";
import {
    exchangeGoogleCodeForTokens,
    extractEmailFromIdToken,
    upsertGoogleConnectionTokens,
} from "@/lib/google-calendar/sync";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const origin = url.origin;
    const code = url.searchParams.get("code");
    const state = (url.searchParams.get("state") ?? "").trim();
    const error = url.searchParams.get("error");

    const consumedMobileSession = state ? await consumeActiveGoogleMobileOAuthSessionByState(state) : null;
    const knownMobileSession = consumedMobileSession ?? (state ? await getGoogleMobileOAuthSessionByState(state) : null);

    if (error) {
        if (knownMobileSession) {
            console.info("[google_oauth_mobile] callback_denied", {
                flow: "google_oauth_mobile",
                status: "callback_oauth_denied",
                sid_prefix: sidPrefix(knownMobileSession.sid),
                reason: "provider_denied",
            });
            return NextResponse.redirect(appendStatusToMobileReturnUrl(knownMobileSession.return_url, "oauth_denied"));
        }
        return NextResponse.redirect(`${origin}/settings?googleCalendar=oauth_denied`);
    }

    if (!code || !state) {
        if (knownMobileSession) {
            console.info("[google_oauth_mobile] callback_invalid_state", {
                flow: "google_oauth_mobile",
                status: "callback_invalid_state",
                sid_prefix: sidPrefix(knownMobileSession.sid),
                reason: "missing_code_or_state",
            });
            return NextResponse.redirect(appendStatusToMobileReturnUrl(knownMobileSession.return_url, "invalid_state"));
        }
        return NextResponse.redirect(`${origin}/settings?googleCalendar=missing_code`);
    }

    if (consumedMobileSession) {
        console.info("[google_oauth_mobile] callback_received", {
            flow: "google_oauth_mobile",
            status: "callback_received",
            sid_prefix: sidPrefix(consumedMobileSession.sid),
        });
    }

    try {
        // Use the admin client so we can write without needing a live user session
        const adminSupabase = createAdminClient();
        const tokens = await exchangeGoogleCodeForTokens(code);
        const accountEmail = extractEmailFromIdToken(tokens.id_token);
        if (consumedMobileSession) {
            await upsertGoogleConnectionTokens(adminSupabase, consumedMobileSession.user_id, tokens, accountEmail);
            console.info("[google_oauth_mobile] callback_connected", {
                flow: "google_oauth_mobile",
                status: "callback_connected",
                sid_prefix: sidPrefix(consumedMobileSession.sid),
            });
            return NextResponse.redirect(appendStatusToMobileReturnUrl(consumedMobileSession.return_url, "connected"));
        }

        if (knownMobileSession) {
            console.info("[google_oauth_mobile] callback_invalid_state", {
                flow: "google_oauth_mobile",
                status: "callback_invalid_state",
                sid_prefix: sidPrefix(knownMobileSession.sid),
                reason: "expired_or_replayed_state",
            });
            return NextResponse.redirect(appendStatusToMobileReturnUrl(knownMobileSession.return_url, "invalid_state"));
        }

        const cookieStore = await cookies();
        const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
        cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);
        if (!expectedState || expectedState !== state) {
            return NextResponse.redirect(`${origin}/settings?googleCalendar=invalid_state`);
        }

        const legacyMobileReturnUrl = cookieStore.get(GOOGLE_OAUTH_MOBILE_RETURN_COOKIE)?.value || null;
        cookieStore.delete(GOOGLE_OAUTH_MOBILE_RETURN_COOKIE);

        const cookieUserId = cookieStore.get(GOOGLE_OAUTH_USER_ID_COOKIE)?.value || null;
        cookieStore.delete(GOOGLE_OAUTH_USER_ID_COOKIE);

        let userId: string;
        if (cookieUserId) {
            userId = cookieUserId;
        } else {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
            }
            userId = user.id;
        }

        await upsertGoogleConnectionTokens(adminSupabase, userId, tokens, accountEmail);
        if (legacyMobileReturnUrl) {
            return NextResponse.redirect(appendStatusToMobileReturnUrl(legacyMobileReturnUrl, "connected"));
        }
        return NextResponse.redirect(`${origin}/settings?googleCalendar=connected`);
    } catch (callbackError) {
        console.error("Google OAuth callback failed:", callbackError);
        if (knownMobileSession) {
            console.info("[google_oauth_mobile] callback_connect_failed", {
                flow: "google_oauth_mobile",
                status: "callback_connect_failed",
                sid_prefix: sidPrefix(knownMobileSession.sid),
                reason: callbackError instanceof Error ? callbackError.message : "unknown",
            });
            return NextResponse.redirect(appendStatusToMobileReturnUrl(knownMobileSession.return_url, "connect_failed"));
        }
        return NextResponse.redirect(`${origin}/settings?googleCalendar=connect_failed`);
    }
}
