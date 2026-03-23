import { getWorkingFriendActivities } from "@/actions/friends";
import { getPendingVouchRequests } from "@/actions/voucher";
import VoucherDashboardClient from "../voucher/voucher-dashboard-client";

export default async function FriendsPage() {
    const [pendingTasks, workingFriends] = await Promise.all([
        getPendingVouchRequests(),
        getWorkingFriendActivities(),
    ]);

    return (
        <VoucherDashboardClient
            pendingTasks={pendingTasks}
            workingFriends={workingFriends}
        />
    );
}
