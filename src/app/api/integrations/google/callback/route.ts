import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google-calendar/constants";
import {
    exchangeGoogleCodeForTokens,
    extractEmailFromIdToken,
    upsertGoogleConnectionTokens,
} from "@/lib/google-calendar/sync";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const origin = url.origin;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
        return NextResponse.redirect(`${origin}/settings?googleCalendar=oauth_denied`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${origin}/settings?googleCalendar=missing_code`);
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
    cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

    if (!expectedState || expectedState !== state) {
        return NextResponse.redirect(`${origin}/settings?googleCalendar=invalid_state`);
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
    }

    const mobileReturnUrl = cookieStore.get("vouch_google_oauth_mobile_return")?.value || null;
    cookieStore.delete("vouch_google_oauth_mobile_return");

    try {
        const tokens = await exchangeGoogleCodeForTokens(code);
        const accountEmail = extractEmailFromIdToken(tokens.id_token);
        await upsertGoogleConnectionTokens(supabase, user.id, tokens, accountEmail);

        if (mobileReturnUrl) {
            const returnWithStatus = `${mobileReturnUrl}?status=connected`;
            return NextResponse.redirect(returnWithStatus);
        }
        return NextResponse.redirect(`${origin}/settings?googleCalendar=connected`);
    } catch (callbackError) {
        console.error("Google OAuth callback failed:", callbackError);
        if (mobileReturnUrl) {
            return NextResponse.redirect(`${mobileReturnUrl}?status=connect_failed`);
        }
        return NextResponse.redirect(`${origin}/settings?googleCalendar=connect_failed`);
    }
}
