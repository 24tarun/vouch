import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface DispatchRequestBody {
  outboxId?: number | string;
}

interface TriggerResponseBody {
  id?: string;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
const triggerSecretKey = Deno.env.get("TRIGGER_SECRET_KEY")?.trim();
const triggerApiUrl = Deno.env.get("TRIGGER_API_URL")?.trim() || "https://api.trigger.dev";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for google-calendar-dispatch-mobile.");
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resolveUserIdFromBearer(authHeader: string | null): Promise<string | null> {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await adminSupabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

async function triggerGoogleCalendarDispatch(outboxId: number) {
  if (!triggerSecretKey?.startsWith("tr_")) {
    return {
      success: false,
      retryScheduled: true,
      error: "TRIGGER_SECRET_KEY is not configured for immediate Google sync.",
    };
  }

  const response = await fetch(`${triggerApiUrl}/api/v1/tasks/google-calendar-dispatch/trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${triggerSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: { outboxId },
      context: {},
      options: {},
    }),
  });

  let parsed: TriggerResponseBody | null = null;
  try {
    parsed = (await response.clone().json()) as TriggerResponseBody;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    return {
      success: false,
      retryScheduled: true,
      error: `Trigger.dev dispatch failed with HTTP ${response.status}.`,
      details: parsed,
    };
  }

  return {
    success: true,
    retryScheduled: false,
    runId: parsed?.id ?? null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const userId = await resolveUserIdFromBearer(request.headers.get("Authorization"));
  if (!userId) {
    return json({ error: "Not authenticated." }, 401);
  }

  let body: DispatchRequestBody;
  try {
    body = (await request.json()) as DispatchRequestBody;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const parsedOutboxId = typeof body.outboxId === "string"
    ? Number(body.outboxId)
    : body.outboxId;

  if (!Number.isInteger(parsedOutboxId) || Number(parsedOutboxId) <= 0) {
    return json({ error: "outboxId must be a positive integer." }, 400);
  }

  const { data: outboxRow, error: outboxError } = await adminSupabase
    .from("google_calendar_sync_outbox")
    .select("id, user_id, status")
    .eq("id", parsedOutboxId)
    .maybeSingle();

  if (outboxError) {
    return json({ error: outboxError.message }, 500);
  }

  if (!outboxRow || outboxRow.user_id !== userId) {
    return json({ error: "Outbox row not found." }, 404);
  }

  const result = await triggerGoogleCalendarDispatch(parsedOutboxId);
  if (!result.success) {
    return json(result, 202);
  }

  return json(result, 200);
});
