"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const pushSubscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
});

/**
 * Saves a web push subscription for the current user.
 */
export async function saveSubscription(subscription: any) {
    const parsedSubscription = pushSubscriptionSchema.safeParse(subscription);
    if (!parsedSubscription.success) {
        return { success: false, error: "Invalid push subscription data" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { error } = await (supabase.from("web_push_subscriptions") as any).upsert({
        user_id: user.id,
        subscription,
        updated_at: new Date().toISOString(),
    }, {
        onConflict: "user_id, subscription"
    });

    if (error) {
        console.error("Error saving subscription:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Deletes a web push subscription.
 */
export async function deleteSubscription(subscription: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await (supabase
        .from("web_push_subscriptions") as any)
        .delete()
        .eq("user_id", user.id)
        .eq("subscription", subscription);

    if (error) {
        console.error("Error deleting subscription:", error);
    }
}
