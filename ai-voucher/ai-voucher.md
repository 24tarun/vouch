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
