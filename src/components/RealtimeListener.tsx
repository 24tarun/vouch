"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ENABLE_REALTIME_DEBUG_LOGS = process.env.NODE_ENV !== "production";

export function RealtimeListener({ userId }: { userId: string }) {
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const refreshTimeoutRef = useRef<number | null>(null);
    const lastRefreshAtRef = useRef(0);
    const friendIdsRef = useRef<Set<string>>(new Set());
    const REFRESH_THROTTLE_MS = 300;

    useEffect(() => {
        if (!userId) return;
        const supabase = supabaseRef.current;
        let isActive = true;

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

        const scheduleRefresh = () => {
            const now = Date.now();
            const elapsed = now - lastRefreshAtRef.current;
            const remaining = Math.max(0, REFRESH_THROTTLE_MS - elapsed);
            if (refreshTimeoutRef.current) return;

            refreshTimeoutRef.current = window.setTimeout(() => {
                lastRefreshAtRef.current = Date.now();
                refreshTimeoutRef.current = null;
                router.refresh();
            }, remaining);
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
                    scheduleRefresh();
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
                    scheduleRefresh();
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
    }, [userId, router]);

    return null;
}
