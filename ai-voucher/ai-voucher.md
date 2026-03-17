# The Orca Mother — AI Voucher

An AI agent that acts as a voucher for tasks the user doesn't want to share with their real social circle. The orca mother is already the app's accountability figurehead — this makes her literal. She watches. She judges. She doesn't gossip.

---

## Why This Exists

Some tasks are private. Cleaning the toilet. Journaling. Taking medication. Calling a parent. A user should still be held accountable for these without exposing them to friends or vouchers. The orca mother fills this gap — she's always available, she never judges beyond the task, and she keeps nothing.

This is not self-vouching. The AI actively evaluates proof and can deny it. It has teeth.

---

## Behaviour

- **Input:** task description + submitted proof (image or video)
- **Output:** `approved` or `denied`
  - On approval: silent. Task marked complete.
  - On denial: a single plain-English reason. No fluff. Orca mother energy.
    - e.g. *"Denied. The toilet in this image has not been cleaned — the bowl is visibly dirty."*
    - e.g. *"Denied. This video does not show the task described."*
- **No explanations on approval** — if she's satisfied, she nods and moves on
- **Persona in output:** direct, brief, slightly stern. Not cruel. She's holding you accountable, not humiliating you.

---

## Score Weight

Tasks vouched by the orca mother count **0.5×** toward the reputation score vs. human-vouched tasks.

Rationale: an AI can be fooled in ways a person who knows you cannot. A friend who knows your kitchen knows if that photo is recent. The mother doesn't. Her approval is worth something, but not as much.

**Not surfaced in the UI.** The 0.5× weight is applied silently — users who care enough to look at how the score is calculated will infer it. It is not shown at voucher selection time or anywhere on the task. No need to make the user feel they're getting a lesser experience for choosing privacy.

**Half beats nothing.** A user logging a private task and getting 0.5× accountability is better than them not logging it at all. The goal is to keep people honest, not to punish them for having private habits.

---

## Model — Google Gemini 2.0 Flash

**Why Gemini 2.0 Flash:**
- Native image AND video support — no frame extraction hacks needed
- Cheapest capable multimodal API available (~$0.075/1M input tokens)
- Google File API handles video uploads cleanly before the inference call
- Structured JSON output mode — forces the response schema, no parsing guesswork
- Fast enough for a near-real-time vouching decision

**Cost estimate:**
- Image proof: ~500–1000 tokens → fraction of a cent per decision
- 30s video proof: ~3000–5000 tokens → still fractions of a cent
- At any realistic usage scale, this is essentially free to run

**Alternatives considered and rejected:**
- GPT-4o mini — no native video, requires frame extraction workaround
- Claude Haiku — same problem, no native video
- Qwen VL — cheaper but less reliable structured output, images only

---

## Technical Implementation

### Flow

```
User submits proof (image/video)
  → Server action receives file
  → If video: upload to Gemini File API → get file URI
  → If image: convert to base64 inline
  → Build prompt (task description + proof + system instructions)
  → Call Gemini 2.0 Flash with structured output schema
  → Receive { decision, reason? }
  → Store on task record, flag as AI-vouched
  → Apply 0.5× weight in reputation score calculation
```

### Structured Output Schema

Force Gemini to return only this shape — no free-form text:

```typescript
const schema = {
  type: "object",
  properties: {
    decision: {
      type: "string",
      enum: ["approved", "denied"]
    },
    reason: {
      type: "string"
      // only present on denial
    }
  },
  required: ["decision"]
}
```

### System Prompt Design

The system prompt does three things: sets the persona, explains the task context, and constrains the output strictly.

```
You are a strict but fair accountability judge reviewing proof of task completion.

Task: {task_description}
Deadline: {task_deadline}

The user has submitted proof. Your job is to decide whether the proof credibly demonstrates that this task was completed.

Rules:
- If the proof clearly shows the task was completed, return approved.
- If the proof is ambiguous, unconvincing, or clearly does not match the task, return denied.
- On denial, provide one plain sentence explaining why. Be direct. No softening.
- On approval, provide no reason — just approved.
- Do not be fooled by staged, partial, or irrelevant proof.
- You are the last line of accountability. Take it seriously.
```

### Video Upload (Gemini File API)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleAIFileManager } from "@google/generative-ai/server"

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)

// Upload video
const uploadResult = await fileManager.uploadFile(videoPath, {
  mimeType: "video/mp4",
  displayName: "task-proof"
})

// Wait for processing
let file = await fileManager.getFile(uploadResult.file.name)
while (file.state === "PROCESSING") {
  await new Promise(r => setTimeout(r, 2000))
  file = await fileManager.getFile(uploadResult.file.name)
}

// Use in inference call
const result = await model.generateContent([
  { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
  { text: prompt }
])
```

### Image Inline (base64)

```typescript
const result = await model.generateContent([
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64ImageString
    }
  },
  { text: prompt }
])
```

---

## Privacy Guarantees

- Proof files submitted to the AI voucher are **not stored by Vouch** beyond what's needed to display the task record
- Gemini File API uploaded videos are automatically deleted after 48 hours by Google
- The task itself (description, proof, decision) is only visible to the user — not their friend group, not their vouchers
- This should be surfaced clearly in the UI: *"This task is private. Only you and the Orca Mother can see it."*

---

## UI Treatment

- When selecting a voucher, the orca mother appears as an option alongside friends — distinct, not just a fallback
- Her avatar is the illustrated orca mother character
- A small **AI** badge or indicator on the task card so the user always knows this was AI-vouched
- On denial, her response appears as a message — not a system error. It's her voice.
- On approval, a subtle nod animation (her Rive state) — no fanfare, she's not impressed, she's satisfied

---

## Response Time & Queuing

The orca mother does not need to be instant. Real human vouchers can take up to 2 days — the AI operates within the same window. In practice Gemini responses are near-instant, but there is no UX pressure to make this feel real-time.

If multiple proof submissions arrive simultaneously, they are processed in a FIFO queue. No cap on simultaneous AI-vouched active tasks per user.

**Notification on decision:** When the mother approves or denies, a push notification is sent to the user. The copy should be dramatic and in character:
- Approval: *"The mother has reviewed your proof. You may proceed."*
- Denial: *"The mother has decided your fate. [denial reason]"*

This makes the async nature feel intentional — she deliberated, she judged. Not a loading spinner, a verdict.

---

## Escalation — Denied by the Mother

If the orca mother denies a task, the user can **escalate to a real human voucher**. The human sees:
- The task description
- The submitted proof
- The mother's denial reason

The human voucher then makes the final call. If they approve, the task is marked complete — but at the standard human-vouched weight, not elevated. The escalation path exists so a user isn't permanently stuck on a bad AI decision, not as a way to shop for a more lenient judge.

Escalation should feel like an appeal, not a retry — the UI should reflect that the user is contesting a decision, not just re-submitting.

---

## Cost & Monetization

- **Free for all users** — the developer bears the Gemini API cost
- At current scale (small friend group testing), cost is negligible
- If usage grows significantly, a subscription or one-off payment can be introduced — but this is out of scope for now and should not be designed for prematurely

### Pricing breakdown (Gemini 2.0 Flash-Lite — $0.25/1M input, $1.50/1M output)

Gemini charges video at **258 tokens per second**, resolution-independent (720p = 1080p = same cost).

| Proof type | Tokens | Cost per decision |
|---|---|---|
| 10s video | ~2,600 | ~$0.00065 |
| 30s video | ~7,800 | ~$0.00195 |
| 60s video | ~15,500 | ~$0.0039 |
| Single image | ~300–800 | ~$0.0001 |
| Output (decision + reason) | ~30–50 tokens | negligible |

**$1 buys ~500 decisions at 30s video. $10 buys ~5,000.**

### Proof video cap — 60 seconds

The app enforces a **60-second maximum** on proof videos before upload. Enforced client-side before the file is sent to the API. Long enough for any legitimate proof, keeps per-decision cost under $0.004, and prevents accidental large uploads.

---

## Decisions Locked

- **Available from day one** — no history requirement to unlock
- **No simultaneous task limit** — queue them, don't cap them
- **0.5× weight applied silently** — not shown in UI, users infer it if they care to
- **Free for all users** — revisit only if costs become significant at scale

---
---

# Implementation Plan

> What follows is the engineering plan for building the Orca Mother into the Vouch codebase. Every section maps to a phase of work.

---

## Phase 1 — Database & Identity

**New migration: `supabase/migrations/043_orca_mother_ai_voucher.sql`**

`tasks.voucher_id` is `UUID NOT NULL FK → profiles(id)`, and `profiles.id` is `FK → auth.users(id) ON DELETE CASCADE`. The AI voucher needs a real identity in the database — there's no way around the FK chain.

1. **Insert a dedicated auth user** into `auth.users` with a pre-determined UUID and email `orca-mother@vouch.internal`. No password, no auth provider — this user cannot log in.
2. The existing `handle_new_user` trigger auto-creates the `profiles` row. **Update the profile** to set `username = 'Orca Mother'`.
3. **Add column**: `tasks.ai_escalated_from boolean NOT NULL DEFAULT false` — tracks tasks originally AI-vouched but later escalated to a human voucher. Needed for reputation (still 0.5×) and UI ("Originally reviewed by Orca Mother").

```sql
-- Insert system user for Orca Mother
INSERT INTO auth.users (id, email, role, instance_id, aud, created_at, updated_at)
VALUES (
  'PREDEFINED-UUID-HERE',
  'orca-mother@vouch.internal',
  'authenticated',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

-- handle_new_user trigger fires → profile row created
-- Then update the profile:
UPDATE public.profiles
SET username = 'Orca Mother'
WHERE id = 'PREDEFINED-UUID-HERE';

-- Track escalation history
ALTER TABLE public.tasks
ADD COLUMN ai_escalated_from boolean NOT NULL DEFAULT false;
```

---

## Phase 2 — Constants & Config

**New file: `src/lib/ai-voucher/constants.ts`**

```typescript
// Hardcoded — must match the UUID in migration 043
export const ORCA_MOTHER_PROFILE_ID = "PREDEFINED-UUID-HERE";

export const AI_VOUCHER_REPUTATION_MULTIPLIER = 0.5;

export const AI_VOUCHER_DISPLAY_NAME = "Orca Mother";

export function isAiVouched(task: { voucher_id: string }): boolean {
  return task.voucher_id === ORCA_MOTHER_PROFILE_ID;
}

export function isAiVouchedOrEscalated(task: {
  voucher_id: string;
  ai_escalated_from?: boolean;
}): boolean {
  return isAiVouched(task) || Boolean(task.ai_escalated_from);
}
```

**New env var:** `GEMINI_API_KEY` — added to `.env.local`, **server-only** (no `NEXT_PUBLIC_` prefix). Never sent to the client. Never committed to git.

**New npm dependency:** `@google/generative-ai` — Google's official Generative AI SDK.

---

## Phase 3 — Gemini Integration (Server-Only)

**New file: `src/lib/ai-voucher/gemini.ts`**

This module is **only imported from server actions and Trigger.dev jobs**. Never from client components.

```typescript
export async function evaluateProofWithGemini(params: {
  taskTitle: string;
  taskDeadline: string;
  proofBuffer: Buffer;
  mimeType: string;
  mediaKind: "image" | "video";
}): Promise<{ decision: "approved" | "denied"; reason?: string }>
```

- **Image path**: convert `proofBuffer` to base64, send inline via `model.generateContent()` with structured JSON output schema.
- **Video path**: write buffer to temp file, upload via `GoogleAIFileManager`, poll until `ACTIVE`, then inference call with `fileData`.
- **Structured output schema** forces `{ decision: "approved" | "denied", reason?: string }` — no free-form parsing.
- **System prompt** as defined in the spec above (strict accountability judge persona).
- **Temp files** cleaned up in `finally` block.
- **Timeout**: 30s for images, 120s for video (including File API upload + processing).

---

## Phase 4 — Evaluation Orchestrator

**New file: `src/lib/ai-voucher/evaluate.ts`**

```typescript
export async function processAiVoucherDecision(taskId: string): Promise<void>
```

1. Fetch task + proof row using `createAdminClient()` (bypasses RLS — no auth session for AI).
2. Verify task is `AWAITING_VOUCHER` and voucher is Orca Mother.
3. Download proof binary from Supabase storage via admin client.
4. Call `evaluateProofWithGemini()`.
5. **If approved**:
   - Update task status → `COMPLETED`, set `has_proof = true`
   - Delete proof from storage + DB (matches `voucherAccept` pattern)
   - Write `task_events` row: type `AI_APPROVE`
   - Invalidate caches (`tasks:active:{userId}`)
6. **If denied**:
   - Update task status → `FAILED`
   - Delete proof from storage + DB (matches `voucherDeny` pattern)
   - Write `task_events` row: type `AI_DENY`, metadata `{ reason: "..." }`
   - Create `ledger_entries` row: `entry_type = 'failure'`, `amount_cents = task.failure_cost_cents`
   - Invalidate caches
7. Send push notification to user:
   - Approve: *"The mother has reviewed your proof. You may proceed."*
   - Deny: *"The mother has decided your fate. {reason}"*

Pattern mirrors `voucherAccept`/`voucherDeny` in `src/actions/voucher.ts` but uses admin client.

---

## Phase 5 — Server Action Changes

**File: `src/actions/tasks.ts`**

### 5a. Task creation bypass

In `createTask` and `createTaskSimple`: bypass the friendship validation check when `voucherId === ORCA_MOTHER_PROFILE_ID`. The AI voucher is always available — she's not a "friend".

Also: force `requires_proof = true` when voucher is Orca Mother. The AI can't vouch without evidence.

### 5b. Completion flow

In `markTaskCompleteWithProofIntent`, after the non-self-vouch branch sets status to `AWAITING_VOUCHER`:

- **No proof submitted** → auto-deny immediately. AI needs evidence. Return error with message.
- **Image proof** → after `finalizeTaskProofUpload` is called, invoke `processAiVoucherDecision()` inline. Gemini is ~1–3s for images.
- **Video proof** → task stays `AWAITING_VOUCHER`. The Trigger.dev job (Phase 6) handles it after upload finalizes.

In `finalizeTaskProofUpload`, after marking proof `UPLOADED`:
- If AI-vouched + image → call `processAiVoucherDecision()` inline
- If AI-vouched + video → trigger the Trigger.dev `ai-voucher-evaluate` job

### 5c. New action: `escalateToHumanVoucher`

```typescript
export async function escalateToHumanVoucher(
  taskId: string,
  newVoucherId: string
): Promise<ActionResult>
```

- Validates: task is `FAILED`, original voucher was Orca Mother, new voucher is self or friend
- Changes `voucher_id` → new human voucher
- Sets `ai_escalated_from = true`
- Resets status → `AWAITING_VOUCHER`
- Sets new `voucher_response_deadline`
- Creates negative ledger entry (cancels the AI denial's failure charge — like rectify)
- Writes `AI_ESCALATE_TO_HUMAN` task event
- Sends notification to the new human voucher

---

## Phase 6 — Async Video Processing (Trigger.dev)

**New file: `src/trigger/ai-voucher-evaluate.ts`**

Event-triggered Trigger.dev task (not cron). Fired from `finalizeTaskProofUpload` when an AI-vouched video proof finishes uploading.

- Calls `processAiVoucherDecision(taskId)`
- Retries on Gemini API failure: 3 attempts with exponential backoff
- On permanent failure: notify user that evaluation failed, leave task in `AWAITING_VOUCHER` so they can escalate

---

## Phase 7 — Reputation Changes

**`src/lib/reputation/algorithm.ts`**
- In delivery score calculation: weight AI-vouched completed tasks at **0.5×**
- Check both `isAiVouched(task)` and `task.ai_escalated_from` — escalated tasks stay 0.5× even after a human approves
- AI-denied failures still count at full weight (accountability doesn't get a discount)

**`src/lib/reputation/types.ts`**
- Add `ai_escalated_from: boolean` to `ReputationTaskInput`

**`src/lib/reputation/constants.ts`**
- Add `AI_VOUCHER_REPUTATION_MULTIPLIER = 0.5`

**`src/actions/reputation.ts`**
- Include `ai_escalated_from` in task select queries and mapping to `ReputationTaskInput`

---

## Phase 8 — Background Job Exclusions

**`src/trigger/voucher-timeout.ts`**
- Skip tasks where `voucher_id === ORCA_MOTHER_PROFILE_ID`. The AI processes deterministically — if the job fails, it should retry, not auto-accept.

**`src/trigger/voucher-deadline-warning.ts`**
- Skip AI-vouched tasks. There's no human voucher to warn.

---

## Phase 9 — UI Changes

### Voucher picker (`src/components/TaskInput.tsx`)
- Add "Orca Mother" as an option in the voucher `<Select>`, positioned before the friends list (after "Myself")
- Distinct styling: teal/AI indicator, not just another name in the list
- Value = `ORCA_MOTHER_PROFILE_ID`

### Title parser (`src/lib/task-title-parser.ts`)
- Recognize `vouch orca` / `.v orca` as resolving to `ORCA_MOTHER_PROFILE_ID`
- Add to ghost-text autocomplete suggestions

### Task row (`src/components/TaskRow.tsx`)
- Small **AI** badge on task cards when voucher is Orca Mother

### Task detail (`src/app/dashboard/tasks/[id]/task-detail-client.tsx`)
- **AWAITING_VOUCHER + AI voucher** → *"The Orca Mother is reviewing your proof..."*
- **COMPLETED + AI voucher** → *"Approved by Orca Mother"* (no reason on approval)
- **FAILED + AI voucher** → Show denial reason (from `AI_DENY` task event metadata) + **"Escalate to Friend"** button
- Escalation button opens a friend picker, then calls `escalateToHumanVoucher`
- Privacy notice on all AI-vouched tasks: *"This task is private. Only you and the Orca Mother can see it."*

### Voucher dashboard (`src/app/dashboard/voucher/`)
- AI-vouched tasks do NOT appear in the human voucher queue. The Orca Mother's tasks are processed by the system.

---

## Phase 10 — Type Updates

**`src/lib/types.ts`**
- Add `ai_escalated_from?: boolean` to the `Task` type interface

---

## Phase 11 — Proof Enforcement (Defense in Depth)

AI-vouched tasks MUST require proof — the AI can't vouch without evidence.

- **At creation**: Force `requires_proof = true` when voucher is Orca Mother (in `createTask` / `createTaskSimple`)
- **At completion**: Reject `markTaskCompleteWithProofIntent` if AI-vouched and no `proofIntent` provided

Both layers. Belt and suspenders.

---

## Security Checklist

- [ ] `GEMINI_API_KEY` is never in any `NEXT_PUBLIC_` variable
- [ ] `gemini.ts` is never imported from client components — only server actions + Trigger.dev
- [ ] Orca Mother auth user has no password / no auth provider — cannot log in
- [ ] All AI voucher DB operations use `createAdminClient()` (bypasses RLS safely)
- [ ] `escalateToHumanVoucher` validates that original voucher was AI before allowing reassignment
- [ ] Proof downloaded via admin client, never via `/api/task-proofs/` route (which requires `auth.uid()`)
- [ ] Video uploads to Gemini File API are ephemeral — Google auto-deletes after 48h
- [ ] Rate limit AI evaluations per user to prevent abuse

---

## Files Changed (Summary)

| File | Change |
|------|--------|
| `supabase/migrations/043_*.sql` | **New**: auth user, profile, `ai_escalated_from` column |
| `src/lib/ai-voucher/constants.ts` | **New**: `ORCA_MOTHER_PROFILE_ID`, helpers |
| `src/lib/ai-voucher/gemini.ts` | **New**: Gemini API integration (server-only) |
| `src/lib/ai-voucher/evaluate.ts` | **New**: AI decision orchestrator |
| `src/trigger/ai-voucher-evaluate.ts` | **New**: async video evaluation job |
| `src/actions/tasks.ts` | Bypass friendship check, inline AI eval, `escalateToHumanVoucher` |
| `src/lib/reputation/algorithm.ts` | 0.5× delivery weight for AI-vouched tasks |
| `src/lib/reputation/types.ts` | Add `ai_escalated_from` field |
| `src/lib/reputation/constants.ts` | Add `AI_VOUCHER_REPUTATION_MULTIPLIER` |
| `src/actions/reputation.ts` | Include `ai_escalated_from` in queries |
| `src/components/TaskInput.tsx` | Orca Mother in voucher picker |
| `src/lib/task-title-parser.ts` | `vouch orca` / `.v orca` support |
| `src/components/TaskRow.tsx` | AI badge on task cards |
| `src/app/dashboard/tasks/[id]/task-detail-client.tsx` | AI status, denial reason, escalation UI |
| `src/trigger/voucher-timeout.ts` | Skip AI-vouched tasks |
| `src/trigger/voucher-deadline-warning.ts` | Skip AI-vouched tasks |
| `src/lib/types.ts` | `ai_escalated_from` field |
| `context/context.md` | Document the new feature |

---

## Verification Checklist

1. **Create an AI-vouched task**: Select Orca Mother as voucher → task created with correct `voucher_id`, `requires_proof` forced true
2. **Mark complete with image proof**: Proof uploaded → Gemini evaluates inline → task transitions to COMPLETED or FAILED within ~3s
3. **Mark complete with video proof**: Task stays AWAITING_VOUCHER → Trigger.dev job fires → evaluates → transitions
4. **Denial + escalation**: AI denies → user sees reason → escalates to friend → friend can accept/deny normally → `ai_escalated_from = true`
5. **Reputation**: AI-vouched completed task contributes 0.5× to delivery score (verify with `getUserReputationScore`)
6. **No proof = no submission**: Attempting to mark complete without proof on AI-vouched task is rejected
7. **Voucher timeout/warning jobs**: AI-vouched tasks not picked up — verify with job logs
8. **Security**: Run `next build`, search client bundles for `GEMINI_API_KEY` — must find nothing
