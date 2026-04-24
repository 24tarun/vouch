import { randomBytes, randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MOBILE_RETURN_ALLOWLIST = ["vouch://"];
const DEFAULT_TTL_SECONDS = 60 * 10;

export type GoogleMobileOAuthSession = {
    id: string;
    sid: string;
    oauth_state: string;
    user_id: string;
    return_url: string;
    expires_at: string;
    consumed_at: string | null;
    created_at: string;
};

type MobileSessionQuery = {
    insert(values: Record<string, unknown>): Promise<{ error: { message?: string } | null }>;
    update(values: Record<string, unknown>): MobileSessionQuery;
    select(columns: string): MobileSessionQuery;
    eq(column: string, value: string): MobileSessionQuery;
    is(column: string, value: null): MobileSessionQuery;
    gt(column: string, value: string): MobileSessionQuery;
    maybeSingle(): Promise<{ data: unknown | null }>;
};

function mobileSessionQuery(): MobileSessionQuery {
    const adminSupabase = createAdminClient();
    return adminSupabase.from("google_oauth_mobile_sessions") as unknown as MobileSessionQuery;
}

export function isSafeMobileReturnUrl(url: string): boolean {
    return MOBILE_RETURN_ALLOWLIST.some((prefix) => url.startsWith(prefix));
}

export function isGoogleMobileTokenQueryFallbackEnabled(): boolean {
    const raw = process.env.GOOGLE_MOBILE_TOKEN_QUERY_FALLBACK;
    if (!raw) return true;
    const normalized = raw.trim().toLowerCase();
    return normalized !== "0" && normalized !== "false" && normalized !== "off";
}

export function appendStatusToMobileReturnUrl(returnUrl: string, status: string): string {
    const separator = returnUrl.includes("?") ? "&" : "?";
    return `${returnUrl}${separator}status=${encodeURIComponent(status)}`;
}

export function sidPrefix(sid: string): string {
    return sid.slice(0, 8);
}

export async function createGoogleMobileOAuthSession(input: {
    userId: string;
    returnUrl: string;
    ttlSeconds?: number;
}): Promise<{ sid: string; state: string; expiresAt: string }> {
    const ttlSeconds = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const table = mobileSessionQuery();

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const sid = randomBytes(24).toString("base64url");
        const state = randomUUID();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

        const { error } = await table.insert({
            sid,
            oauth_state: state,
            user_id: input.userId,
            return_url: input.returnUrl,
            expires_at: expiresAt,
        });

        if (!error) {
            return { sid, state, expiresAt };
        }

        const message = error instanceof Error ? error.message : String(error?.message ?? error);
        // Unique collision retries are safe and rare.
        if (!message.toLowerCase().includes("duplicate")) {
            throw error;
        }
    }

    throw new Error("Failed to create mobile OAuth session");
}

export async function getActiveGoogleMobileOAuthSessionBySid(
    sid: string
): Promise<GoogleMobileOAuthSession | null> {
    const now = new Date().toISOString();

    const { data } = await mobileSessionQuery()
        .select("id, sid, oauth_state, user_id, return_url, expires_at, consumed_at, created_at")
        .eq("sid", sid)
        .is("consumed_at", null)
        .gt("expires_at", now)
        .maybeSingle();

    return (data as GoogleMobileOAuthSession | null) ?? null;
}

export async function getGoogleMobileOAuthSessionByState(
    state: string
): Promise<GoogleMobileOAuthSession | null> {
    const { data } = await mobileSessionQuery()
        .select("id, sid, oauth_state, user_id, return_url, expires_at, consumed_at, created_at")
        .eq("oauth_state", state)
        .maybeSingle();

    return (data as GoogleMobileOAuthSession | null) ?? null;
}

export async function consumeActiveGoogleMobileOAuthSessionByState(
    state: string
): Promise<GoogleMobileOAuthSession | null> {
    const now = new Date().toISOString();

    const { data } = await mobileSessionQuery()
        .update({ consumed_at: now })
        .eq("oauth_state", state)
        .is("consumed_at", null)
        .gt("expires_at", now)
        .select("id, sid, oauth_state, user_id, return_url, expires_at, consumed_at, created_at")
        .maybeSingle();

    return (data as GoogleMobileOAuthSession | null) ?? null;
}
