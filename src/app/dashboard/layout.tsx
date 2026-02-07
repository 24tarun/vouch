import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/NavLinks";
import { RealtimeListener } from "@/components/RealtimeListener";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch vouch requests count
    const { count: vouchCount } = await supabase
        .from("tasks")
        .select("*", { count: 'exact', head: true })
        .eq("voucher_id", user.id)
        .eq("status", "AWAITING_VOUCHER");

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <RealtimeListener userId={user.id} />
            {/* Navigation */}
            <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 pt-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-14 flex items-center">
                        <NavLinks vouchCount={vouchCount || 0} />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pl-safe pr-safe pb-safe">
                {children}
            </main>
        </div>
    );
}
