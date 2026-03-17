# Vouch — Mascot, Orca Pod & Animation System

UI/UX personality through a living ocean world. The app has a cast of characters, a world they live in, and moments where that world bleeds into the UI in ways that feel surprising and delightful.

---

## The World — The Deep Antarctic Ocean

The dashboard background is no longer a flat dark surface. It is the deep Antarctic ocean — dark navy/teal, cold, vast. Subtle details make it feel alive without distracting:

- **Water caustic light** — faint rippling light patterns on the "floor," like sunlight filtering through shallow water
- **Distant light rays** — soft, barely visible beams descending from above
- **Occasional bubbles** — small, slow-rising, barely noticeable
- **Water surface line** — visible at the very top of the screen, with light refraction shimmer
- **Ambient movement** — the whole background has an extremely subtle slow drift, like you're underwater looking at a current

This is the stage. The orca pod lives here.

---

## The Cast

### The Mother — The Accountability Enforcer
The central character of the app. She is:
- **Illustrated style** — colorful, expressive, cartoonish. Not realistic, not flat. Think the energy of a kid's drawing brought to life — bold outlines, bright colors, exaggerated features. Duolingo-adjacent but with more attitude.
- **Strict, no-nonsense** — she wears large, slightly pretentious round glasses. She carries a stick/pointer. She has an expression that says "I'm watching you."
- **She is the reputation score.** Her mood and posture reflect the user's standing.
- She is the mother of the pod. She is responsible for everyone. That's why she's strict.

### The Orca Children — The Users
Each user in the app is represented by their own unique orca child:
- **User avatars = their orca child** — each one has a distinct color palette, accessories, and expression. No two are the same.
- **Childish, round, playful** — big eyes, stubby fins, wobbly swim
- **They grow and evolve** — a child with a 30-day streak is slightly bigger, swims more confidently. A child who has been failing tasks swims a bit sadly, dragging their tail.
- **They are the ones who interact with tasks** — when you complete something, your orca child is the one who shows up to do it

---

## The Ocean Background — Ambient Pod Behavior

The orca pod exists in the background at all times. Their presence is **ambient, not demanding** — you can ignore them entirely and still use the app normally. But if you look, something is always happening.

- **Idle:** The pod drifts slowly across the background every few minutes. The mother leads, children trail behind in loose formation. They disappear off one edge and reappear from the other.
- **Multiple users active:** If friends in your group are also using the app right now, their orca children join the pod swimming across your background. The pod grows.
- **Night/late session:** The ocean gets slightly darker. Bioluminescent trails follow the orca as they swim.
- **All tasks complete for the day:** The whole pod swims in a loop together. The mother nods. Rare and earned.

---

## Page-by-Page Interactions

### Dashboard

| Moment | Orca Interaction |
|---|---|
| **Task completion** | Your orca child detaches from the pod, swims up to the completion circle, breaches through it, and splashes back down. The circle fills. |
| **Pomodoro session starts** | The mother slowly swims closer to the foreground, watching. Her glasses catch a glint. |
| **Pomodoro ends** | The mother nods once, swims back to depth. |
| **Task deadline approaching** | The mother turns to face the screen, taps her stick once. Subtle — not alarming. |
| **All tasks completed today** | The pod does a celebratory swim-through together. The mother allows herself a small smile — rare. |
| **No tasks created yet** | The mother is in the foreground, tapping her stick impatiently on the ocean floor. "Well?" |
| **Long idle session** | The pod gradually slows, children start to float lazily. Mother nudges them. |
| **Recurring streak milestone (7/14/30 days)** | The orca child associated with that recurring task briefly glows, swims faster, does a spin. |

### Friends Page

| Moment | Orca Interaction |
|---|---|
| **Viewing a friend's profile** | Their orca child appears, swims a short loop, shows off a little (or slouches, depending on their rep score) |
| **Sending a friend request** | Your orca child swims to the edge of the screen and passes a small note to another orca just off-screen |
| **Friend accepts your vouching request** | Their orca child swims in from the right and joins your pod briefly |
| **Friend fails a task you vouched** | Their orca child droops, swims low, avoids eye contact with your orca child |

### Stats Page

| Moment | Orca Interaction |
|---|---|
| **Page load** | The mother is in front of an underwater chalkboard, pointer in hand, waiting |
| **Good stats month** | She taps the good numbers with her stick approvingly |
| **Bad stats month** | She taps the bad numbers and looks directly at you through her glasses |
| **Pending proof reviews** | A small orca child swims up holding a scroll — the proof — waiting for the mother to review it |

### Ledger Page

| Moment | Orca Interaction |
|---|---|
| **Clean month (no failures)** | The mother does something she almost never does — a slow, dignified breach. Respect. |
| **Failed tasks in the month** | She swims slowly past the red numbers, shaking her head, glasses sliding down her nose |
| **Charitable donation triggered** | A small coin/bubble floats upward from the screen. The mother watches it go, satisfied. |

### Reputation Score (wherever it lives on dashboard)

| Moment | Orca Interaction |
|---|---|
| **Score displayed** | The mother hovers beside the number, posture reflecting the tier |
| **Score going up this week** | She swims upward slightly, chin raised |
| **Score going down** | She faces the user directly, arms crossed (fins crossed). Glasses. |
| **Tier upgrade** | This is the biggest moment. Full pod breach. The mother allows genuine pride — a wide smile, glasses pushed up. Happens once and then returns to normal. |
| **Dropped below a tier** | The mother slowly shakes her head. The children look away. Gut-punch energy, brief. |

### Login / Onboarding

| Moment | Orca Interaction |
|---|---|
| **Login page** | The mother is at the top of the screen, students arranged below her. "You're back." energy. |
| **First ever login / onboarding** | The mother introduces herself. The children wave. Sets the tone immediately that this app has a world. |
| **Returning after long absence** | The mother is there, arms crossed, but then relaxes slightly. "You came back." Complicated feelings. |

### Empty States

| Screen | Orca behaviour |
|---|---|
| No tasks | Mother tapping stick, impatient |
| No friends | Your orca child alone, swimming in a small loop, looking around |
| No proof submitted | Your orca child holds empty fins out — "where is it?" |
| No activity this week | The pod drifts past very slowly. No eye contact. |

---

## Art Direction — Visual Style

- **NOT realistic** — no photo-accurate orca. This is illustrated, expressive, almost childlike in its boldness.
- **NOT flat/minimal** — there's depth, shading, personality in the linework. Think Duolingo's owl but with more attitude and color.
- **Color palette:** Each orca child has a distinct vibrant color (coral, teal, amber, lime, etc.) against the dark ocean. The mother is classic black and white but her glasses and stick are a deep gold/brass.
- **Expressions matter** — the faces do a lot of the emotional work. The mother especially must have a wide expressive range despite being a strict character.
- **Scale:** The orca characters are small relative to the screen — they live in the background world, not the foreground UI. They should never obscure content.

---

## Tech Stack

### Rive — character animation (the orca characters)
- rive.app — visual animation editor, exports `.riv` files
- State machines handle all the conditional behavior (trigger "celebrate" state, Rive handles the transition)
- **Web:** `@rive-app/react-canvas`
- **Mobile:** `rive-react-native`
- Same `.riv` file works across all platforms
- This is what Duolingo uses for their character animations
- **You write ~10 lines of code.** The animator builds all the states in Rive's editor.

### Spline — 3D rotating tomato
- **spline.design** (free, browser-based 3D tool) — create or import a tomato model, add looping Y-axis rotation, export
- **Web:** `@splinetool/react-spline` — drop-in React component, ~2 lines of code
- **Mobile:** Spline has no React Native runtime — export a looping **WebP** from Spline as the mobile fallback
- Speed change (idle vs. active Pomodoro session) handled via Spline's event API or by swapping between two exported WebPs

### CSS / SVG animation — the ocean background
- The ocean background is an SVG or Canvas element with CSS keyframe animations
- Water caustic effects: CSS `@keyframes` with opacity/transform
- Bubbles: small SVG circles with float animation
- Light rays: CSS gradients with slow opacity pulse
- Achievable without a designer — mostly geometry and CSS

### Framer Motion — UI micro-interactions
- Completion circle pulse/fill
- Score count-up
- Tier upgrade number transition
- These are code-level, no external assets

---

## What to Commission vs. Build Yourself

| Task | Who | Notes |
|---|---|---|
| Orca mother design + all expression states | Illustrator/character designer | Most important hire — sets the whole visual tone |
| User orca child template (customizable per user) | Same illustrator | Needs to be a system, not individual designs |
| Rive animation — mother state machine | Rive animator | Brief with the states table above |
| Rive animation — orca child state machine | Rive animator | Can be same person |
| Ocean background SVG | Designer or you | Mostly CSS/SVG geometry |
| 3D rotating tomato | You — built in Spline (free), exported as React component for web, WebP loop for mobile |
| Integrating Rive into React | You | ~10 lines per component |
| Framer Motion interactions | You | Well documented |

---

## Decisions Locked

- **Ocean background:** Dashboard only
- **Orca children:** Randomly generated per user (color + accessory combos). User can change it if they want.
- **Mother name:** None. Nameless. The mystique stays.
- **Mobile background:** Undecided — revisit when building mobile.
- **Pomodoro tomato:** 3D model built in Spline. Web via `@splinetool/react-spline`, mobile via exported looping WebP.
- **Tomato rotation axis:** Y-axis (true 3D spin) — requires a 3D model, not an SVG.
