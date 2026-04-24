import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    GOOGLE_OAUTH_MOBILE_RETURN_COOKIE,
    GOOGLE_OAUTH_STATE_COOKIE,
    GOOGLE_OAUTH_USER_ID_COOKIE,
} from "@/lib/google-calendar/constants";
import { buildGoogleOAuthUrl } from "@/lib/google-calendar/sync";
import {
    getActiveGoogleMobileOAuthSessionBySid,
    isGoogleMobileTokenQueryFallbackEnabled,
    isSafeMobileReturnUrl,
    sidPrefix,
} from "@/lib/google-calendar/mobile-oauth";
import { checkRateLimit, googleOauthMobileLimiter } from "@/lib/rate-limit";

// GET /api/integrations/google/start?mobile=1&sid=<opaque>[&return=vouch://settings/calendar&token=<access_token>]
//
// Web flow:   no `token` param — authenticates via Supabase cookie session (normal SSR auth).
// Mobile flow: passes `token=<supabase_jwt>` — no cookie session exists in the WebBrowser
//              context, so we validate the JWT with the admin client and store the resolved
//              user_id in a short-lived httpOnly cookie for the callback to read.
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const isMobile = searchParams.get("mobile") === "1";
    const returnUrl = searchParams.get("return") ?? "";
    const mobileToken = searchParams.get("token") ?? "";
    const sid = searchParams.get("sid")?.trim() ?? "";

    if (isMobile && returnUrl && !isSafeMobileReturnUrl(returnUrl)) {
        return NextResponse.json({ error: "Invalid return URL" }, { status: 400 });
    }

    if (isMobile) {
        const rateId = sid || `ip:${request.headers.get("x-forwarded-for") ?? "unknown"}`;
        const { limited } = await checkRateLimit(googleOauthMobileLimiter, `google-mobile-start-route:${rateId}`);
        if (limited) {
            console.info("[google_oauth_mobile] start_rate_limited", {
                flow: "google_oauth_mobile",
                status: "start_429",
                reason: "rate_limited",
            });
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }
    }

    if (isMobile && sid) {
        const mobileSession = await getActiveGoogleMobileOAuthSessionBySid(sid);
        if (!mobileSession) {
            console.info("[google_oauth_mobile] start_not_authenticated", {
                flow: "google_oauth_mobile",
                status: "start_401",
                reason: "invalid_or_expired_sid",
                sid_prefix: sidPrefix(sid),
            });
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        console.info("[google_oauth_mobile] start_redirect", {
            flow: "google_oauth_mobile",
            status: "start_redirect",
            sid_prefix: sidPrefix(sid),
        });

        const oauthUrl = buildGoogleOAuthUrl(mobileSession.oauth_state);
        return NextResponse.redirect(oauthUrl);
    }

    let userId: string;

    if (isMobile) {
        if (!mobileToken || !isGoogleMobileTokenQueryFallbackEnabled()) {
            console.info("[google_oauth_mobile] start_not_authenticated", {
                flow: "google_oauth_mobile",
                status: "start_401",
                reason: "missing_sid_or_fallback_disabled",
            });
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        console.warn("[google_oauth_mobile] token_query_fallback_used", {
            flow: "google_oauth_mobile",
            status: "token_query_fallback_used",
        });

        // Mobile: validate the bearer JWT with the admin client
        const adminSupabase = createAdminClient();
        const { data: { user }, error } = await adminSupabase.auth.getUser(mobileToken);
        if (error || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        userId = user.id;
    } else {
        // Web: use the cookie-based SSR session
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        userId = user.id;
    }

    const state = randomUUID();
    const cookieStore = await cookies();
    const cookieOpts = {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10, // 10 minutes
    };

    cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOpts);
    cookieStore.set(GOOGLE_OAUTH_USER_ID_COOKIE, userId, cookieOpts);

    if (isMobile && returnUrl) {
        cookieStore.set(GOOGLE_OAUTH_MOBILE_RETURN_COOKIE, returnUrl, cookieOpts);
    }

    const oauthUrl = buildGoogleOAuthUrl(state);
    return NextResponse.redirect(oauthUrl);
}
