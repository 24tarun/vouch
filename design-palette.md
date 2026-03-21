# TAS Design Palette

## Background & Surface Colors

| Token       | Hex       | Tailwind     | Usage                          |
|-------------|-----------|--------------|--------------------------------|
| `--bg`      | `#020617` | `slate-950`  | Page background                |
| `--surface` | `#0f172a` | `slate-900`  | Section backgrounds, nav       |
| `--card`    | `#1e293b` | `slate-800`  | Cards, input backgrounds       |
| `--border`  | `#1e293b` | `slate-800`  | Default borders                |
| `--border-hi`| `#334155`| `slate-700`  | Hover / highlighted borders    |

## Text Colors

| Token        | Hex       | Tailwind     | Usage                          |
|--------------|-----------|--------------|--------------------------------|
| `--fg`       | `#f8fafc` | `slate-50`   | Primary text                   |
| `--fg-dim`   | `#94a3b8` | `slate-400`  | Secondary / muted text         |
| `--fg-muted` | `#334155` | `slate-700`  | Placeholder / disabled text    |

## Accent — Cyan

The primary accent throughout the app (Pomodoro timer, CTAs, glows, interactive elements).

| Token           | Value                      | Usage                          |
|-----------------|----------------------------|--------------------------------|
| `--cyan`        | `#00d9ff`                  | Buttons, highlights, italic text |
| `--cyan-glow`   | `rgba(0, 217, 255, 0.35)`  | Default glow / drop-shadow     |
| `--cyan-glow-hi`| `rgba(0, 217, 255, 0.6)`   | Hover glow                     |

**Glow usage:**
```css
filter: drop-shadow(0 0 10px rgba(0, 217, 255, 0.35));
box-shadow: 0 0 18px rgba(0, 217, 255, 0.35);
```

## Solarized Status Badge Colors

Matches TaskRow, CommitmentCard, and voucher dashboard status indicators.

| Token        | Hex       | Tailwind       | Status                  |
|--------------|-----------|----------------|-------------------------|
| `--s-amber`  | `#fbbf24` | `amber-400`    | Pending / Awaiting      |
| `--s-emerald`| `#34d399` | `emerald-400`  | Completed / Verified    |
| `--s-red`    | `#f87171` | `red-400`      | Failed / Error          |
| `--s-cyan`   | `#22d3ee` | `cyan-400`     | Settled / Active        |
| `--s-orange` | `#fb923c` | `orange-400`   | Rectified / In Review   |
| `--s-purple` | `#c084fc` | `purple-400`   | Repeat tasks            |
| `--s-blue`   | `#93c5fd` | `blue-300`     | Voucher / Info          |

**Badge pattern:**
```css
font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
padding: 3px 8px; border-radius: 3px; border: 1px solid;
background: rgba(<color>, 0.08);
```

## Typography

| Role         | Font              | Weights           | Usage                        |
|--------------|-------------------|-------------------|------------------------------|
| Display/Hero | Cormorant         | 300, 400, 500 italic | Headlines, brand moments  |
| Body/UI      | DM Mono           | 300, 400, 500     | Labels, body, buttons, code  |

**Google Fonts import:**
```
https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap
```

**Classes:**
```css
.fc { font-family: 'Cormorant', Georgia, serif; }
.fm { font-family: 'DM Mono', 'Courier New', monospace; }
```

## Animations

```css
@keyframes riseUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.rise { animation: riseUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
.d1   { animation-delay: 0.12s; }
.d2   { animation-delay: 0.24s; }
.d3   { animation-delay: 0.36s; }
.d4   { animation-delay: 0.50s; }
.d5   { animation-delay: 0.64s; }
```

## Eyebrow Label Pattern

```css
.eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--cyan);
  display: flex; align-items: center; gap: 14px;
}
.eyebrow::before {
  content: ''; display: inline-block;
  width: 32px; height: 1px;
  background: var(--cyan);
  box-shadow: 0 0 6px rgba(0, 217, 255, 0.35);
}
```

## Button Patterns

**Solid (primary CTA):**
```css
background: var(--cyan); color: #000;
font-family: 'DM Mono'; font-size: 12px; font-weight: 500;
letter-spacing: 0.1em; text-transform: uppercase;
box-shadow: 0 0 18px rgba(0, 217, 255, 0.35);
/* hover: box-shadow: 0 0 28px rgba(0, 217, 255, 0.6); transform: translateY(-2px); */
```

**Outline (secondary):**
```css
background: transparent; color: var(--fg-dim);
border: 1px solid var(--border-hi);
font-family: 'DM Mono'; font-size: 12px;
/* hover: color: var(--fg); border-color: var(--cyan); */
```

## Radial Hero Glow

Ambient background effect used behind hero headlines.

```css
background: radial-gradient(ellipse at center, rgba(0, 217, 255, 0.06) 0%, transparent 70%);
width: 900px; height: 600px;
position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
pointer-events: none;
```

## Noise Grain Overlay

Subtle film grain applied via `body::after` on landing/auth pages.

```css
opacity: 0.02;
background-image: url("data:image/svg+xml,...fractalNoise...");
background-size: 200px 200px;
position: fixed; inset: 0; pointer-events: none; z-index: 9999;
```
