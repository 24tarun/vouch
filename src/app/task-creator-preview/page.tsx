import { createClient } from "@/lib/supabase/server";
import { getFriends } from "@/actions/friends";
import { DEFAULT_FAILURE_COST_CENTS } from "@/lib/constants";
import { PreviewClient } from "./PreviewClient";

export default async function TaskCreatorPreviewPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [friends, profileData] = await Promise.all([
        user ? getFriends() : Promise.resolve([]),
        user
            ? supabase.from("profiles").select("default_failure_cost_cents").eq("id", user.id).maybeSingle().then((r) => r.data as { default_failure_cost_cents: number } | null)
            : Promise.resolve(null),
    ]);

    const defaultFailureCost = ((profileData?.default_failure_cost_cents ?? DEFAULT_FAILURE_COST_CENTS) / 100);

    return <PreviewClient friends={friends} selfUserId={user?.id ?? ""} defaultFailureCost={defaultFailureCost} />;
}
