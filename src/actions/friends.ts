"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type Database, type FriendPomoActivity } from "@/lib/types";
import { type SupabaseClient } from "@supabase/supabase-js";

export async function addFriend(formData: FormData) {
    const supabase: SupabaseClient<Database> = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const email = formData.get("email") as string;

    if (!email) {
        return { error: "Email is required" };
    }

    // Find user by email
    // @ts-ignore
    const { data: friend } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("email", email)
        .single();

    if (!friend) {
        return { error: "No user found with that email" };
    }

    // @ts-ignore
    if (friend.id === user.id) {
        return { error: "You cannot add yourself as a friend" };
    }

    // Check if already friends (either direction)
    // @ts-ignore
    const { data: existing } = await supabase
        .from("friendships" as any)
        .select("*")
        .eq("user_id", (user as any).id)
        .eq("friend_id", (friend as any).id)
        .single();

    if (existing) {
        return { error: "Already friends with this user" };
    }

    // Use admin client for both inserts to ensure symmetric creation
    const supabaseAdmin = createAdminClient();

    // 1. User -> Friend
    // @ts-ignore
    const { error: error1 } = await supabaseAdmin.from("friendships" as any).insert({
        user_id: (user as any).id,
        friend_id: (friend as any).id,
    });

    if (error1 && error1.code !== '23505') {
        console.error("Failed to create friendship (user->friend):", error1);
        return { error: "Failed to add friend" };
    }

    // 2. Friend -> User (reciprocal)
    // @ts-ignore
    const { error: error2 } = await supabaseAdmin.from("friendships" as any).insert({
        user_id: (friend as any).id,
        friend_id: (user as any).id,
    });

    if (error2 && error2.code !== '23505') {
        console.error("Failed to create reciprocal friendship (friend->user):", error2);
        // Don't fail - the first link was created
    }

    try {
        revalidatePath("/dashboard/friends");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tasks/new");
    } catch {
        // Ignore revalidation errors
    }
    return { success: true };
}

export async function removeFriend(friendId: string) {
    const supabase: SupabaseClient<Database> = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Check if friend is active voucher for any pending tasks
    // @ts-ignore
    const { data: activeTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("voucher_id", friendId)
        .in("status", [
            "CREATED",
            "POSTPONED",
            "MARKED_COMPLETED",
            "AWAITING_VOUCHER",
        ]);

    if (activeTasks && activeTasks.length > 0) {
        return {
            error:
                "Cannot remove friend who is an active voucher for pending tasks",
        };
    }

    // Use admin client for both deletions to ensure symmetric removal
    const supabaseAdmin = createAdminClient();

    // Delete User -> Friend
    // @ts-ignore
    const { error: error1 } = await supabaseAdmin
        .from("friendships")
        .delete()
        .eq("user_id", user.id)
        .eq("friend_id", friendId);

    if (error1) {
        console.error("Failed to delete friendship (user->friend):", error1);
        return { error: "Failed to remove friend" };
    }

    // Delete Friend -> User (reciprocal)
    // @ts-ignore
    const { error: error2 } = await supabaseAdmin
        .from("friendships")
        .delete()
        .eq("user_id", friendId)
        .eq("friend_id", user.id);

    if (error2) {
        console.error("Failed to delete reciprocal friendship:", error2);
        // Don't fail - the first deletion was successful
    }

    // If the removed friend was the default voucher, fall back to self.
    // @ts-ignore
    const { error: clearDefaultError } = await (supabase.from("profiles" as any) as any)
        .update({ default_voucher_id: user.id } as any)
        .eq("id", user.id as any)
        .eq("default_voucher_id", friendId as any);

    if (clearDefaultError) {
        console.error("Failed to clear default voucher after removing friend:", clearDefaultError);
    }

    try {
        revalidatePath("/dashboard/friends");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tasks/new");
    } catch {
        // Ignore revalidation errors
    }
    return { success: true };
}

export async function getFriends() {
    const supabase: SupabaseClient<Database> = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // @ts-ignore
    const { data: friendships } = await supabase
        .from("friendships")
        .select(
            `
      *,
      friend:profiles!friendships_friend_id_fkey(*)
    `
        )
        .eq("user_id", user.id);

    return (friendships as any)?.map((f: any) => f.friend) || [];
}

function getPomoStatusPriority(status: "ACTIVE" | "PAUSED") {
    return status === "ACTIVE" ? 2 : 1;
}

export async function getWorkingFriendActivities(): Promise<FriendPomoActivity[]> {
    const supabase: SupabaseClient<Database> = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // @ts-ignore
    const { data: friendships } = await supabase
        .from("friendships")
        .select(
            `
      friend_id,
      friend:profiles!friendships_friend_id_fkey(id, username)
    `
        )
        .eq("user_id", user.id);

    const rows = (friendships as Array<{ friend_id: string; friend: { id: string; username: string | null } | null }> | null) || [];
    if (rows.length === 0) return [];

    const friendMetaById = new Map<string, string>();
    for (const row of rows) {
        if (!row?.friend_id) continue;
        const fallbackName = "Friend";
        friendMetaById.set(row.friend_id, row.friend?.username || fallbackName);
    }

    const friendIds = [...friendMetaById.keys()];
    if (friendIds.length === 0) return [];

    // Rely on RLS: friends can only read ACTIVE/PAUSED sessions for linked friends.
    // @ts-ignore
    const { data: sessions, error: sessionsError } = await (supabase.from("pomo_sessions") as any)
        .select("user_id, status, updated_at")
        .in("user_id", friendIds as any)
        .in("status", ["ACTIVE", "PAUSED"] as any)
        .order("updated_at", { ascending: false });

    if (sessionsError) {
        console.error("Failed to load working friend activities:", sessionsError);
        return [];
    }

    const bestSessionByFriend = new Map<string, { status: "ACTIVE" | "PAUSED"; updated_at: string }>();

    for (const session of ((sessions as Array<{ user_id: string; status: "ACTIVE" | "PAUSED"; updated_at: string }> | null) || [])) {
        if (!session?.user_id || !friendMetaById.has(session.user_id)) continue;
        if (session.status !== "ACTIVE" && session.status !== "PAUSED") continue;

        const current = bestSessionByFriend.get(session.user_id);
        if (!current) {
            bestSessionByFriend.set(session.user_id, {
                status: session.status,
                updated_at: session.updated_at,
            });
            continue;
        }

        const currentPriority = getPomoStatusPriority(current.status);
        const incomingPriority = getPomoStatusPriority(session.status);
        const currentUpdatedTs = new Date(current.updated_at).getTime() || 0;
        const incomingUpdatedTs = new Date(session.updated_at).getTime() || 0;

        if (
            incomingPriority > currentPriority ||
            (incomingPriority === currentPriority && incomingUpdatedTs > currentUpdatedTs)
        ) {
            bestSessionByFriend.set(session.user_id, {
                status: session.status,
                updated_at: session.updated_at,
            });
        }
    }

    return [...bestSessionByFriend.entries()]
        .map(([friendId, session]) => ({
            friend_id: friendId,
            friend_username: friendMetaById.get(friendId) || "Friend",
            status: session.status,
        }))
        .sort((a, b) => {
            const priorityDiff = getPomoStatusPriority(b.status) - getPomoStatusPriority(a.status);
            if (priorityDiff !== 0) return priorityDiff;
            return a.friend_username.localeCompare(b.friend_username);
        });
}
