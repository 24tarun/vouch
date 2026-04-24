import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types";
import { compileLedgerTillDateEmailData } from "@/lib/ledger/till-date";
import { sendNotification } from "@/lib/notifications";
import { formatCurrencyFromCents } from "@/lib/currency";

function getBearerToken(req: NextRequest): string | null {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
}

async function getAuthenticatedUser(req: NextRequest): Promise<{ userId: string | null; email: string | null; error: string | null }> {
    const bearerToken = getBearerToken(req);
    if (bearerToken) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
        const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(bearerToken);
        if (error || !user) {
            return { userId: null, email: null, error: "Not authenticated" };
        }
        return { userId: user.id, email: user.email ?? null, error: null };
    }

    const supabase = await createServerClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) {
        return { userId: null, email: null, error: "Not authenticated" };
    }
    return { userId: user.id, email: user.email ?? null, error: null };
}

export async function POST(req: NextRequest) {
    try {
        const { userId, email, error: authError } = await getAuthenticatedUser(req);
        if (authError || !userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        if (!email) {
            return NextResponse.json({ error: "Email missing on authenticated account" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const compiled = await compileLedgerTillDateEmailData(supabase, userId);
        if (compiled.error || !compiled.data) {
            return NextResponse.json({ error: compiled.error ?? "Could not compile ledger." }, { status: 400 });
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
        const charityLine = summary.charityName
            ? `<p style="margin: 24px 0 8px 0; font-size: 15px; color: #1e293b;">Please send this amount manually to <strong>${summary.charityName}</strong>.</p>`
            : `<p style="margin: 24px 0 8px 0; font-size: 15px; color: #1e293b;">No active charity is selected in your preferences.</p>`;

        await sendNotification({
            to: email,
            userId,
            push: false,
            subject: `Ledger Till Date: ${summary.donationFormatted}`,
            title: "Ledger Till Date",
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

        return NextResponse.json({ success: true, message: "Ledger till date email sent." }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
