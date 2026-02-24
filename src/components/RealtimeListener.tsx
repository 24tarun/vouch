"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    emitRealtimeTaskChange,
    type RealtimeTaskChange,
    type RealtimeTaskEventType,
    type RealtimeTaskRow,
} from "@/lib/realtime-task-events";

const ENABLE_REALTIME_DEBUG_LOGS = process.env.NODE_ENV !== "production";
const FAST_REFRESH_THROTTLE_MS = 300;
const RECONCILIATION_REFRESH_MS = 1200;

function isTaskPatchEnabledPath(pathname: string | null): boolean {
    if (!pathname) return false;
    return (
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/tasks/") ||
        pathname.startsWith("/dashboard/voucher") ||
        pathname.startsWith("/dashboard/friends")
    );
}

function toRealtimeTaskEventType(value: unknown): RealtimeTaskEventType | null {
    if (typeof value !== "string") return null;
    const normalized = value.toUpperCase();
    if (normalized === "INSERT" || normalized === "UPDATE" || normalized === "DELETE") {
        return normalized;
    }
    return null;
}

function toRealtimeTaskRow(value: unknown): RealtimeTaskRow | null {
    if (!value || typeof value !== "object") return null;
    const row = value as Partial<RealtimeTaskRow>;
    if (
        typeof row.id !== "string" ||
        typeof row.user_id !== "string" ||
        typeof row.voucher_id !== "string" ||
        typeof row.status !== "string" ||
        typeof row.updated_at !== "string"
    ) {
        return null;
    }

    return row as RealtimeTaskRow;
}

export function RealtimeListener({ userId }: { userId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabaseRef = useRef(createClient());
    const refreshTimeoutRef = useRef<number | null>(null);
    const nextRefreshAtRef = useRef(0);
    const lastRefreshAtRef = useRef(0);
    const friendIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;
        const supabase = supabaseRef.current;
        let isActive = true;
        const patchEnabledForPath = isTaskPatchEnabledPath(pathname);

        const syncFriendIds = async () => {
            const { data, error } = await supabase
                .from("friendships")
                .select("friend_id")
                .eq("user_id", userId);

            if (!isActive || error) return;

            const nextFriendIds = new Set<string>();
            for (const row of ((data as Array<{ friend_id?: string }> | null) || [])) {
                if (row?.friend_id) nextFriendIds.add(row.friend_id);
            }
            friendIdsRef.current = nextFriendIds;
        };

        const scheduleRefresh = (mode: "fast" | "reconcile" = "fast") => {
            const throttleMs = mode === "reconcile" ? RECONCILIATION_REFRESH_MS : FAST_REFRESH_THROTTLE_MS;
            const now = Date.now();
            const elapsed = now - lastRefreshAtRef.current;
            const delayMs = Math.max(0, throttleMs - elapsed);
            const nextRefreshAt = now + delayMs;

            if (refreshTimeoutRef.current && nextRefreshAt >= nextRefreshAtRef.current) {
                return;
            }

            if (refreshTimeoutRef.current) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }

            nextRefreshAtRef.current = nextRefreshAt;
            refreshTimeoutRef.current = window.setTimeout(() => {
                lastRefreshAtRef.current = Date.now();
                refreshTimeoutRef.current = null;
                nextRefreshAtRef.current = 0;
                router.refresh();
            }, Math.max(0, nextRefreshAt - Date.now()));
        };

        const emitTaskChange = (
            payload: { eventType?: unknown; new?: unknown; old?: unknown }
        ): RealtimeTaskEventType | null => {
            const eventType = toRealtimeTaskEventType(payload.eventType);
            if (!eventType) return null;

            const change: RealtimeTaskChange = {
                eventType,
                newRow: toRealtimeTaskRow(payload.new),
                oldRow: toRealtimeTaskRow(payload.old),
                receivedAt: Date.now(),
            };
            emitRealtimeTaskChange(change);
            return eventType;
        };

        // Subscribe to tasks relevant to the current user as owner or voucher.
        const tasksChannel = supabase
            .channel('realtime:tasks')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `voucher_id=eq.${userId}`,
                },
                (payload) => {
                    if (ENABLE_REALTIME_DEBUG_LOGS) {
                        console.log("[Realtime][tasks][voucher]", payload.eventType, payload.new, payload.old);
                    }
                    const eventType = emitTaskChange(payload);
                    const refreshMode =
                        eventType === "UPDATE" && patchEnabledForPath ? "reconcile" : "fast";
                    scheduleRefresh(refreshMode);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    if (ENABLE_REALTIME_DEBUG_LOGS) {
                        console.log("[Realtime][tasks][owner]", payload.eventType, payload.new, payload.old);
                    }
                    const eventType = emitTaskChange(payload);
                    const refreshMode =
                        eventType === "UPDATE" && patchEnabledForPath ? "reconcile" : "fast";
                    scheduleRefresh(refreshMode);
                }
            )
            .subscribe((status) => {
                if (ENABLE_REALTIME_DEBUG_LOGS) {
                    console.log("[Realtime][tasks] subscription:", status);
                }
            });

        // Keep local friend IDs in sync so we only refresh for relevant friend pomo updates.
        void syncFriendIds();

        // Subscribe to friendships
        const friendsChannel = supabase
            .channel('realtime:friendships')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friendships',
                },
                (payload) => {
                    const newFriendship = payload.new as { user_id?: string; friend_id?: string } | null;
                    const oldFriendship = payload.old as { user_id?: string; friend_id?: string } | null;

                    const isRelevant =
                        (newFriendship && (newFriendship.user_id === userId || newFriendship.friend_id === userId)) ||
                        (oldFriendship && (oldFriendship.user_id === userId || oldFriendship.friend_id === userId));

                    if (isRelevant) {
                        if (ENABLE_REALTIME_DEBUG_LOGS) {
                            console.log("[Realtime][friendships] relevant update:", payload.eventType);
                        }
                        void syncFriendIds();
                        scheduleRefresh();
                    }
                }
            )
            .subscribe((status) => {
                if (ENABLE_REALTIME_DEBUG_LOGS) {
                    console.log("[Realtime][friendships] subscription:", status);
                }
            });

        // Subscribe to friend pomodoro sessions; refresh only when impacted friend rows change.
        const pomoChannel = supabase
            .channel('realtime:pomo_sessions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pomo_sessions',
                },
                (payload) => {
                    const nextRow = payload.new as { user_id?: string } | null;
                    const prevRow = payload.old as { user_id?: string } | null;
                    const affectedUserIds = [nextRow?.user_id, prevRow?.user_id].filter(
                        (id): id is string => Boolean(id)
                    );

                    if (affectedUserIds.length === 0) return;
                    if (affectedUserIds.includes(userId)) return;

                    const isRelevant = affectedUserIds.some((id) => friendIdsRef.current.has(id));
                    if (!isRelevant) return;

                    if (ENABLE_REALTIME_DEBUG_LOGS) {
                        console.log("[Realtime][pomo_sessions] relevant update:", payload.eventType, payload.new, payload.old);
                    }

                    scheduleRefresh();
                }
            )
            .subscribe((status) => {
                if (ENABLE_REALTIME_DEBUG_LOGS) {
                    console.log("[Realtime][pomo_sessions] subscription:", status);
                }
            });

        return () => {
            isActive = false;
            if (refreshTimeoutRef.current) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(friendsChannel);
            supabase.removeChannel(pomoChannel);
        };
    }, [userId, router, pathname]);

    return null;
}
