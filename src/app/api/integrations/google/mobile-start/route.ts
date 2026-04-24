import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    createGoogleMobileOAuthSession,
    isSafeMobileReturnUrl,
    sidPrefix,
} from "@/lib/google-calendar/mobile-oauth";
import { checkRateLimit, googleOauthMobileLimiter } from "@/lib/rate-limit";

function getBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
        return null;
    }

    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
}

export async function POST(request: NextRequest) {
    try {
        const bearerToken = getBearerToken(request);
        if (!bearerToken) {
            console.info("[google_oauth_mobile] mobile_start_unauthenticated", {
                flow: "google_oauth_mobile",
                status: "mobile_start_401",
                reason: "missing_bearer",
            });
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const {
            data: { user },
            error,
        } = await adminSupabase.auth.getUser(bearerToken);

        if (error || !user) {
            console.info("[google_oauth_mobile] mobile_start_unauthenticated", {
                flow: "google_oauth_mobile",
                status: "mobile_start_401",
                reason: "invalid_bearer",
            });
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { limited, reset } = await checkRateLimit(googleOauthMobileLimiter, `google-mobile-start:${user.id}`);
        if (limited) {
            console.info("[google_oauth_mobile] mobile_start_rate_limited", {
                flow: "google_oauth_mobile",
                status: "mobile_start_429",
                reason: "rate_limited",
            });
            const secondsUntilReset = reset ? Math.max(1, Math.ceil((reset - Date.now()) / 1000)) : 60;
            return NextResponse.json(
                { error: `Too many requests. Please wait ${secondsUntilReset}s and try again.` },
                {
                    status: 429,
                    headers: { "Retry-After": String(secondsUntilReset) },
                }
            );
        }

        let body: { returnUrl?: unknown };
        try {
            body = (await request.json()) as { returnUrl?: unknown };
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl.trim() : "";
        if (!returnUrl || !isSafeMobileReturnUrl(returnUrl)) {
            return NextResponse.json({ error: "Invalid return URL" }, { status: 400 });
        }

        const { sid } = await createGoogleMobileOAuthSession({
            userId: user.id,
            returnUrl,
        });

        console.info("[google_oauth_mobile] mobile_start", {
            flow: "google_oauth_mobile",
            status: "mobile_start_success",
            sid_prefix: sidPrefix(sid),
        });

        const startUrl = `${request.nextUrl.origin}/api/integrations/google/start?mobile=1&sid=${encodeURIComponent(sid)}`;

        return NextResponse.json({ startUrl }, { status: 200 });
    } catch (error) {
        console.error("[google_oauth_mobile] mobile_start_unhandled", error);
        return NextResponse.json({ error: "Failed to start Google authorization" }, { status: 500 });
    }
}
