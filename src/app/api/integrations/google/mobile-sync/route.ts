import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    enableGoogleCalendarAppToGoogleForUser,
    disableGoogleCalendarAppToGoogleForUser,
    enableGoogleCalendarGoogleToAppForUser,
    disableGoogleCalendarGoogleToAppForUser,
    listCalendarsForUserConnection,
    setGoogleCalendarSelection,
    setGoogleCalendarDeadlineSourcePreference,
    setGoogleCalendarDefaultEventDuration,
    disconnectGoogleCalendarForUser,
    setGoogleCalendarImportTaggedOnlyForUser,
    enqueueGoogleCalendarOutbox,
} from "@/lib/google-calendar/sync";

type MobileSyncAction =
    | { type: "toggleAppToGoogle"; enabled: boolean }
    | { type: "toggleGoogleToApp"; enabled: boolean }
    | { type: "setCalendar"; calendarId: string }
    | { type: "setDeadlineSource"; preference: "start" | "end" }
    | { type: "enqueueTask"; taskId: string }
    | { type: "setEventDuration"; durationMinutes: number }
    | { type: "setImportTaggedOnly"; enabled: boolean }
    | { type: "disconnect" }
    | { type: "listCalendars" };

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: MobileSyncAction;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    try {
        switch (body.type) {
            case "toggleAppToGoogle": {
                if (body.enabled) {
                    await enableGoogleCalendarAppToGoogleForUser(user.id);
                } else {
                    await disableGoogleCalendarAppToGoogleForUser(user.id);
                }
                return NextResponse.json({ success: true });
            }

            case "toggleGoogleToApp": {
                if (body.enabled) {
                    await enableGoogleCalendarGoogleToAppForUser(user.id);
                } else {
                    await disableGoogleCalendarGoogleToAppForUser(user.id);
                }
                return NextResponse.json({ success: true });
            }

            case "setCalendar": {
                const calendars = await listCalendarsForUserConnection(supabase, user.id);
                const selected = calendars.find((c) => c.id === body.calendarId);
                if (!selected) {
                    return NextResponse.json({ error: "Calendar not found" }, { status: 400 });
                }
                await setGoogleCalendarSelection(supabase, user.id, selected.id, selected.summary);
                return NextResponse.json({ success: true });
            }

            case "setDeadlineSource": {
                if (body.preference !== "start" && body.preference !== "end") {
                    return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
                }
                await setGoogleCalendarDeadlineSourcePreference(supabase, user.id, body.preference);
                return NextResponse.json({ success: true });
            }

            case "setEventDuration": {
                const mins = Number(body.durationMinutes);
                if (!Number.isInteger(mins) || mins < 5 || mins > 1440) {
                    return NextResponse.json({ error: "Duration must be 5–1440 minutes" }, { status: 400 });
                }
                await setGoogleCalendarDefaultEventDuration(supabase, user.id, mins);
                return NextResponse.json({ success: true });
            }

            case "setImportTaggedOnly": {
                await setGoogleCalendarImportTaggedOnlyForUser(supabase, user.id, body.enabled);
                return NextResponse.json({ success: true });
            }

            case "disconnect": {
                await disconnectGoogleCalendarForUser(user.id);
                return NextResponse.json({ success: true });
            }

            case "listCalendars": {
                const calendars = await listCalendarsForUserConnection(supabase, user.id);
                return NextResponse.json({ calendars });
            }

            case "enqueueTask": {
                if (!body.taskId || typeof body.taskId !== "string") {
                    return NextResponse.json({ error: "taskId required" }, { status: 400 });
                }
                // Verify the task belongs to this user before enqueuing
                const { data: taskRow } = await (supabase.from("tasks") as any)
                    .select("id, user_id, google_sync_for_task")
                    .eq("id", body.taskId)
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (!taskRow) {
                    return NextResponse.json({ error: "Task not found" }, { status: 404 });
                }
                if (!taskRow.google_sync_for_task) {
                    return NextResponse.json({ success: true }); // Nothing to do
                }
                await enqueueGoogleCalendarOutbox(user.id, body.taskId, "UPSERT");
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (err) {
        console.error("[mobile-sync] action failed:", body, err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Action failed" },
            { status: 500 }
        );
    }
}
