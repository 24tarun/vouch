# Vouch Reputation Score

A credit-score-style metric (0–1000) that reflects how reliable a user is across all dimensions of the app. The north star: if a group of 15 friends all use Vouch, the score should be trustworthy enough that one person can look at another's score and genuinely decide whether to rely on them for real-life help. It rewards discipline — not activity volume.

---

## Core Concept

- Range: **0–1000**
- **Base score: 400** — all users start here, representing a neutral/unknown reputation
- **Rate-based, not additive** — computed from ratios and percentages, not raw point sums. This prevents new users from having artificially high scores and veterans from being unfairly punished by a few bad weeks.
- **No minimum history required** — uses Bayesian weighting to blend actual performance with the 400 baseline, weighted by task history volume. The baseline fades out as more tasks are completed. A user with 1 task gets a small nudge from 400, not a jump to 1000. Same method IMDb uses so a 3-review film doesn't outrank The Godfather.

  ```
  score = (base_weight × 400 + history_weight × calculated_score)
          / (base_weight + history_weight)
  ```

  Example trajectory:
  - 0 tasks → 400 (pure baseline)
  - 1 task completed on time → ~420
  - 5 tasks completed → meaningful movement, ~480–520
  - 20+ tasks → actual performance dominates, baseline barely matters

- Score stabilizes and becomes more meaningful as history grows (like a real credit score).
- Should be **recoverable** — a bad week dents it, but doesn't destroy it.

---

## Scoring Categories

### 1. Delivery Rate — 35%
- % of tasks completed on time (no postpone, no fail)
- The baseline: are you delivering what you commit to?

### 2. Discipline (Recurring Tasks) — 25%
- Tracks adherence to **recurring tasks** specifically — these are the strongest signal of real-world dependability
- Completing a one-off task shows motivation. Completing the same recurring task 20 days in a row shows **character**
- Scored by the longest active streaks and overall recurring task completion rate
- **Streak weighting:** step-based milestones — longer streaks unlock higher multipliers, and crossing a milestone feels like an event:

  | Streak | Multiplier |
  |---|---|
  | 1–6 days | 1.0× |
  | 7–13 days | 1.3× |
  | 14–29 days | 1.6× |
  | 30+ days | 2.0× |
- Breaking a long-established recurring streak (15+ days) is penalized more than breaking a 2-day one — because you've proven the habit and then abandoned it
- This is the category that answers: "can I actually rely on this person to show up consistently?"

### 3. Accountability — 20%
- Penalizes failures (heavy) and postponements (moderate)
- Penalties **decay slowly over time** — a failure 6 months ago matters less than one last week
- **Postpone rate** is the metric, not raw count — % of tasks that got postponed (e.g. 1/20 is fine, 1/3 is a pattern)
- Since the app enforces a **one postpone per task limit**, the score just tracks the rate across all tasks

### 4. Proof Quality — 10%
- % of tasks where proof was submitted vs. just self-marking as done
- Rewards transparency — a person who always submits receipts is more trustworthy than one who just clicks done

### 5. Community — 10%
- Tasks vouched for others
- Response time as a voucher (slow vouchers who leave people hanging lose points)
- Quality of vouching (did you actually review the proof or rubber-stamp it?)

---

## Financial Stakes — Not a Score Factor

> **Rejected entirely** — the financial penalty already hits the user's wallet on failure. Double-penalizing via score is overkill, and it's gameable (set €500 on trivial tasks to inflate the multiplier). The score does not factor in financial stake amount at all.

---

## Consistency Multiplier — Compounding Failure Penalty

A single failure costs a flat **−X** points. But consistent failures reveal a behavioral pattern and should cost progressively more:

| Failure streak | Penalty |
|---|---|
| 1st failure | −X |
| 2nd consecutive failure | −X × 1.5 |
| 3rd consecutive failure | −X × 2.0 |
| 4th+ consecutive failures | −X × 2.5 (cap) |

**Rules:**
- Multiplier compounds on **consecutive failures** — no successful completions in between
- Successfully completing a task **resets the multiplier** to 1×
- The 2.5× cap prevents the score from becoming mathematically unrecoverable
- Failures separated by more than ~30 days do **not** compound — a failure from 4 months ago shouldn't chain with one today

This distinguishes a user who stumbles occasionally and recovers from one in a sustained slump — which is the right distinction.

---

## Score Tiers

| Range | Label | Vibe |
|---|---|---|
| 850–1000 | **Untouchable** | Reserved for the obsessively reliable |
| 700–849 | **Solid Rep** | You deliver. People trust you. |
| 550–699 | **Building** | Decent track record, room to grow |
| 400–549 | **New Here** | Not enough history to judge yet — earn your rep |
| 300–399 | **Shaky** | Too many misses lately |
| 0–299 | **On Notice** | Your vouchers are nervous |

> Note: 400 is the starting point for all users. Falling below it requires actively failing — you have to earn a bad reputation, not be born with one.

---

## Score Velocity

Show a delta next to the score: `↑ +12 this week` or `↓ -8 this week`.
- Creates weekly re-engagement loop
- Lets users know immediately if they're trending well or slipping

---

## Score Decay

- If a user goes inactive, their score slowly drifts back toward 500 — not their starting 400, but a neutral midpoint
- Decay is **gradual and transparent**, not punishing — users should never feel like the app is engineering inactivity to farm re-engagement
- Suggested rate: negligible for the first 30 days idle, then a small daily drift after that
- The decay reflects reality: reliability is a current property, not a historical trophy. A 900 from 2 years of inactivity shouldn't mean the same as an active 900.

---

## Recovery Arc

- When a user's score drops significantly and then climbs back, the app should surface this explicitly
- "You've recovered 94 points in the last 30 days" — the comeback story is as emotionally resonant as the streak
- Duolingo only rewards the unbroken streak. Vouch rewards both the streak *and* the comeback, because resilience is also a form of reliability

---

## Friend Groups & Social Score Visibility

- Users can create and belong to **multiple friend groups** — not restricted to a single friends list
- Within each group, members can see each other's scores — this is the primary social visibility surface, not a global leaderboard
- A private **group ranking** is shown: "You're 2nd most reliable among your 9 friends in [group name]"
- Global leaderboards are explicitly avoided — they turn reliability into a competition with strangers, which undermines the trust signal
- Score visibility is meaningful precisely *because* these are people you actually know

---

## Tier Crossings as Events

- Crossing a tier boundary (e.g. Building → Solid Rep) is treated as a moment, not just a number change
- The app acknowledges it with a distinct UI moment
- Optionally, a user's vouchers get a subtle notification: "Alex just crossed into Solid Rep" — passive social proof delivered automatically, no bragging required

---

## Voucher Desirability

- A high-reputation user becomes sought after as a voucher — not through any app mechanic, but organically
- When someone is choosing a voucher for an important task, they can see the candidate's score
- Being asked to vouch for someone's serious commitment is a form of social recognition for your reliability
- This gives the score value *outside* the app's gamification loop — it means something in real human terms

---

## Open Questions

- What should the base penalty **−X** be in score points?
- What is the exact decay rate after 30 days of inactivity?
