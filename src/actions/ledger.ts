"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { formatCurrencyFromCents } from "@/lib/currency";
import { compileLedgerTillDateEmailData } from "@/lib/ledger/till-date";

interface LedgerPeriodRow {
    period: string | null;
}

interface LedgerEntryForPeriod {
    amount_cents: number | null;
    [key: string]: unknown;
}

export async function getLedgerPeriods(): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const currentPeriod = new Date().toISOString().slice(0, 7);

    const { data } = await supabase
        .from("ledger_entries")
        .select("period")
        .eq("user_id", user.id)
        .neq("period", currentPeriod);

    if (!data) return [];
    const unique = [...new Set((data as LedgerPeriodRow[]).map((r) => r.period).filter((period): period is string => typeof period === "string"))];
    return unique.sort((a, b) => b.localeCompare(a));
}

export async function getLedgerEntriesForPeriod(period: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entries: [], totalCents: 0 };

    const { data: entries } = await supabase
        .from("ledger_entries")
        .select(`*, task:tasks(*)`)
        .eq("user_id", user.id)
        .eq("period", period)
        .order("created_at", { ascending: false });

    const typedEntries = (entries ?? []) as LedgerEntryForPeriod[];
    const totalCents = typedEntries.reduce(
        (sum: number, entry) => sum + Number(entry.amount_cents ?? 0),
        0
    );

    return { entries: typedEntries, totalCents };
}

export async function sendLedgerReportEmail() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "Not authenticated or email missing" };
    }

    const compiled = await compileLedgerTillDateEmailData(supabase, user.id);
    if (compiled.error || !compiled.data) {
        return { error: compiled.error ?? "Could not compile ledger till date." };
    }

    const { summary, entries } = compiled.data;
    const rowsHtml = entries.map((entry) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${entry.title}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${entry.entryTypeLabel}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: ${entry.amountCents > 0 ? "#dc322f" : "#859900"}; font-family: monospace;">
                ${entry.amountCents > 0 ? "+" : ""}${formatCurrencyFromCents(entry.amountCents, summary.currency)}
            </td>
        </tr>
    `).join("");

    const totalHeaderLabel = summary.donationCents > 0 ? "Total Charitable Commitment" : "Current Balance";
    const title = summary.donationCents > 0 ? "Ledger Till Date" : "Ledger Till Date: No Donation Due";
    const charityLine = summary.charityName
        ? `<p style="margin: 24px 0 8px 0; font-size: 15px; color: #1e293b;">Please send this amount manually to <strong>${summary.charityName}</strong>.</p>`
        : `<p style="margin: 24px 0 8px 0; font-size: 15px; color: #1e293b;">No active charity is selected in your preferences.</p>`;

    await sendNotification({
        to: user.email,
        userId: user.id,
        push: false,
        subject: `Ledger Till Date: ${summary.donationFormatted}`,
        title,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
                <h1 style="color: #6366f1; margin-bottom: 8px; font-size: 24px;">Ledger Till Date</h1>
                <p style="color: #64748b; margin-top: 0; font-size: 16px;">Compiled through <strong>${new Date().toLocaleDateString()}</strong>.</p>

                <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #9f1239; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">${totalHeaderLabel}</p>
                    <p style="margin: 8px 0 0 0; font-size: 42px; font-weight: 800; color: #e11d48;">${summary.donationFormatted}</p>
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
                    ${rowsHtml}
                    </tbody>
                </table>

                ${charityLine}
                <p style="margin: 0; font-size: 14px; color: #475569;">Payment is not processed in-app.</p>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px;">${summary.message}</p>
            </div>
        `,
        text: summary.message,
    });

    return { success: true };
}
