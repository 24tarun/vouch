/**
 * Trigger: monthly-settlement
 * Runs: Monthly at 09:00 UTC on day 1 (`0 9 1 * *`).
 * What it does when it runs:
 * 1) Computes the previous month period (YYYY-MM).
 * 2) Loads all users and that month's ledger entries in two batched queries.
 * 3) If user total > 0, sends a settlement email with a detailed breakdown and payment CTA.
 * 4) If total is 0 but the user had activity, sends a "perfect month" congratulatory email.
 */
import { schedules } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/notifications";
import { formatCurrencyFromCents, normalizeCurrency } from "@/lib/currency";

interface SettlementUser {
    id: string;
    email: string | null;
    username: string | null;
    currency: string | null;
}

interface SettlementEntry {
    user_id: string;
    amount_cents: number;
    entry_type: string;
    task: {
        title: string | null;
    } | null;
}

function formatLedgerEntryType(entryType: string): string {
    if (entryType === "voucher_timeout_penalty") return "Voucher Timeout Penalty";
    if (entryType === "force_majeure") return "Force Majeure";
    if (entryType === "failure") return "Failure";
    if (entryType === "rectified") return "Rectified";
    return entryType;
}

export const monthlySettlement = schedules.task({
    id: "monthly-settlement",
    cron: "0 9 1 * *", // Run at 9am on the 1st of every month
    run: async () => {
        const supabase = createAdminClient();

        // Calculate LAST month's period (YYYY-MM)
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const period = lastMonth.toISOString().slice(0, 7);
        const monthName = lastMonth.toLocaleString("default", { month: "long", year: "numeric" });

        console.log(`Running settlement for period: ${period}`);

        const { data: usersData, error: usersError } = await (supabase.from("profiles") as any)
            .select("id, email, username, currency");
        if (usersError) {
            console.error("Failed to load profiles for monthly settlement:", usersError);
            return;
        }

        const { data: entriesData, error: entriesError } = await (supabase.from("ledger_entries") as any)
            .select("user_id, amount_cents, entry_type, task:tasks(title)")
            .eq("period", period as any);
        if (entriesError) {
            console.error("Failed to load ledger entries for monthly settlement:", entriesError);
            return;
        }

        const users = (usersData || []) as SettlementUser[];
        const entries = (entriesData || []) as SettlementEntry[];
        if (users.length === 0 || entries.length === 0) return;

        const entriesByUser = new Map<string, SettlementEntry[]>();
        for (const entry of entries) {
            const current = entriesByUser.get(entry.user_id);
            if (current) {
                current.push(entry);
            } else {
                entriesByUser.set(entry.user_id, [entry]);
            }
        }

        for (const user of users) {
            const userEntries = entriesByUser.get(user.id) || [];
            if (userEntries.length === 0) continue;

            const totalCents = userEntries.reduce((sum, entry) => sum + entry.amount_cents, 0);
            const currency = normalizeCurrency(user.currency);

            if (totalCents > 0) {
                const amountFormatted = formatCurrencyFromCents(totalCents, currency);

                const tableRows = userEntries.map((entry) => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${entry.task?.title || "Adjustment"}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatLedgerEntryType(entry.entry_type)}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: ${entry.amount_cents > 0 ? "#dc322f" : "#859900"}; font-family: monospace;">
                            ${entry.amount_cents > 0 ? "+" : ""}${formatCurrencyFromCents(entry.amount_cents, currency)}
                        </td>
                    </tr>
                `).join("");

                await sendNotification({
                    to: user.email || undefined,
                    userId: user.id,
                    subject: `Monthly Settlement: ${amountFormatted} for ${monthName}`,
                    title: "Monthly Settlement",
                    html: `
                        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                            <h1 style="color: #6366f1; margin-bottom: 8px; font-size: 24px;">Monthly Settlement</h1>
                            <p style="color: #64748b; margin-top: 0; font-size: 16px;">The month of <strong>${monthName}</strong> has concluded.</p>

                            <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                                <p style="margin: 0; font-size: 14px; color: #9f1239; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Total Charitable Commitment</p>
                                <p style="margin: 8px 0 0 0; font-size: 42px; font-weight: 800; color: #e11d48;">${amountFormatted}</p>
                            </div>

                            <h3 style="margin-top: 32px; font-size: 18px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Detailed Breakdown</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                                <thead>
                                    <tr style="background: #f8fafc; text-align: left;">
                                        <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Task</th>
                                        <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Type</th>
                                        <th style="padding: 8px; border-bottom: 2px solid #e2e8f0; text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                ${tableRows}
                                </tbody>
                            </table>

                            <div style="margin-top: 40px; background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">Please proceed to settle your commitment to charity.</p>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ledger" style="display: inline-block; background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Settle My Ledger</a>
                            </div>

                            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px;">
                                This is an automated settlement notice sent on the 1st of every month.
                            </p>
                        </div>
                    `,
                });
            } else {
                await sendNotification({
                    to: user.email || undefined,
                    userId: user.id,
                    subject: "Monthly Ledger Settled: Perfect Month!",
                    title: "Monthly Settlement",
                    html: `
                        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 16px;">&#127942;</div>
                            <h1 style="color: #6366f1; margin: 0; font-size: 24px;">Perfect Month!</h1>
                            <p style="color: #64748b; margin-top: 12px; font-size: 16px;">Congratulations, ${user.username}. You successfully completed all your tasks for <strong>${monthName}</strong>.</p>

                            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; border-radius: 8px; margin: 24px 0;">
                                <p style="margin: 0; font-size: 14px; color: #166534; text-transform: uppercase; font-weight: bold;">Final Balance</p>
                                <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: 800; color: #15803d;">${formatCurrencyFromCents(0, currency)}</p>
                            </div>

                            <p style="color: #64748b; font-size: 14px;">Your commitment to consistency is paying off. Let's keep the momentum going!</p>

                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; margin-top: 24px; background: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">New Month, New Goals</a>
                        </div>
                    `,
                });
            }
        }
    },
});
