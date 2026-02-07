import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedPendingVouchCountForVoucher } from "@/actions/voucher";
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

    const vouchCount = await getCachedPendingVouchCountForVoucher(user.id);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <RealtimeListener userId={user.id} />
            {/* Navigation */}
            <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 pt-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-14 flex items-center">
                        <NavLinks vouchCount={vouchCount} />
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
