import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MobileOnboarding } from "@/components/MobileOnboarding";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/dashboard");
    }

    return <MobileOnboarding />;
}
