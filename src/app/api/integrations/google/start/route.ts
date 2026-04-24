import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google-calendar/constants";
import { buildGoogleOAuthUrl } from "@/lib/google-calendar/sync";

const MOBILE_RETURN_ALLOWLIST = ["vouch://"];

function isSafeReturnUrl(url: string): boolean {
    return MOBILE_RETURN_ALLOWLIST.some((prefix) => url.startsWith(prefix));
}

// GET /api/integrations/google/start?mobile=1&return=vouch://settings/calendar
// Initiates the Google OAuth flow. If `mobile=1` and a safe `return` URL are
// provided the callback will deep-link back to the app instead of the web settings.
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isMobile = searchParams.get("mobile") === "1";
    const returnUrl = searchParams.get("return") ?? "";

    if (isMobile && returnUrl && !isSafeReturnUrl(returnUrl)) {
        return NextResponse.json({ error: "Invalid return URL" }, { status: 400 });
    }

    const state = randomUUID();
    const cookieStore = await cookies();
    cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10,
    });

    if (isMobile && returnUrl) {
        cookieStore.set("vouch_google_oauth_mobile_return", returnUrl, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 10,
        });
    }

    const oauthUrl = buildGoogleOAuthUrl(state);
    return NextResponse.redirect(oauthUrl);
}
