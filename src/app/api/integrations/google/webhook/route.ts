import { NextRequest, NextResponse } from "next/server";

// Google Calendar push notifications are acknowledged but not processed.
// Vouch syncs App→Google only; Google Calendar is a read-only view of tasks.
export async function POST(_request: NextRequest) {
    return NextResponse.json({ ok: true });
}
