import { getPendingVouchRequests } from "@/actions/voucher";
import VoucherDashboardClient from "./voucher-dashboard-client";

export default async function VoucherPage() {
    const pendingTasks = await getPendingVouchRequests();

    return (
        <VoucherDashboardClient
            pendingTasks={pendingTasks}
        />
    );
}
