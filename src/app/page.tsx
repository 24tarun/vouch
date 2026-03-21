import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BuildStamp } from "@/components/BuildStamp";
import { Linkedin, Mail, Globe } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap"
        rel="stylesheet"
      />

      <style>{`
        /* ── App palette (slate-950/900/800 — matches dashboard) */
        :root {
          --bg:           #020617;   /* slate-950 */
          --surface:      #0f172a;   /* slate-900 */
          --card:         #1e293b;   /* slate-800 */
          --border:       #1e293b;   /* slate-800 */
          --border-hi:    #334155;   /* slate-700 */
          --fg:           #f8fafc;   /* slate-50  */
          --fg-dim:       #94a3b8;   /* slate-400 */
          --fg-muted:     #334155;   /* slate-700 */

          /* App's cyan accent (seven-seg display / pomodoro) */
          --cyan:         #00d9ff;
          --cyan-glow:    rgba(0, 217, 255, 0.35);
          --cyan-glow-hi: rgba(0, 217, 255, 0.6);

          /* Solarized status palette (from TaskRow / CommitmentCard) */
          --s-amber:      #fbbf24;
          --s-emerald:    #34d399;
          --s-red:        #f87171;
          --s-cyan:       #22d3ee;
          --s-orange:     #fb923c;
          --s-purple:     #c084fc;
          --s-blue:       #93c5fd;
        }

        .fc  { font-family: 'Cormorant', Georgia, serif; }
        .fm  { font-family: 'DM Mono', 'Courier New', monospace; }

        @keyframes riseUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: riseUp 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .d1   { animation-delay: 0.12s; }
        .d2   { animation-delay: 0.24s; }
        .d3   { animation-delay: 0.36s; }
        .d4   { animation-delay: 0.50s; }
        .d5   { animation-delay: 0.64s; }

        /* ── Glow helpers ──────────────────────────────── */
        .cyan-glow  { filter: drop-shadow(0 0 10px var(--cyan-glow)); }
        .text-cyan  { color: var(--cyan); }

        /* ── Buttons ───────────────────────────────────── */
        .btn-solid {
          display: inline-block;
          background: var(--cyan);
          color: #000;
          padding: 13px 32px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 0 18px var(--cyan-glow);
        }
        .btn-solid:hover {
          box-shadow: 0 0 28px var(--cyan-glow-hi);
          transform: translateY(-2px);
        }
        .btn-outline {
          display: inline-block;
          background: transparent;
          color: var(--fg-dim);
          padding: 13px 28px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-decoration: none;
          border: 1px solid var(--border-hi);
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .btn-outline:hover {
          color: var(--fg);
          border-color: var(--cyan);
        }

        /* ── Eyebrow label ─────────────────────────────── */
        .eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--cyan);
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .eyebrow::before {
          content: '';
          display: inline-block;
          width: 32px;
          height: 1px;
          background: var(--cyan);
          box-shadow: 0 0 6px var(--cyan-glow);
          flex-shrink: 0;
        }

        /* ── Status badges ─────────────────────────────── */
        .badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 3px;
          border: 1px solid;
          display: inline-block;
        }
        .badge-amber   { color: var(--s-amber);   border-color: var(--s-amber);   background: rgba(251,191,36,0.08);  }
        .badge-emerald { color: var(--s-emerald); border-color: var(--s-emerald); background: rgba(52,211,153,0.08);  }
        .badge-red     { color: var(--s-red);     border-color: var(--s-red);     background: rgba(248,113,113,0.08); }
        .badge-cyan    { color: var(--s-cyan);    border-color: var(--s-cyan);    background: rgba(34,211,238,0.08);  }
        .badge-orange  { color: var(--s-orange);  border-color: var(--s-orange);  background: rgba(251,146,60,0.08);  }
        .badge-purple  { color: var(--s-purple);  border-color: var(--s-purple);  background: rgba(192,132,252,0.08); }

        /* ── Cards ─────────────────────────────────────── */
        .step-card { transition: background 0.3s, border-color 0.3s; }
        .step-card:hover { background: #0f172a !important; border-color: var(--border-hi) !important; }
        .step-card:hover .step-num { color: var(--cyan) !important; filter: drop-shadow(0 0 8px var(--cyan-glow)); }
        .step-num { transition: color 0.3s, filter 0.3s; }

        .feat-item { transition: border-color 0.3s; }
        .feat-item:hover { border-color: var(--cyan) !important; }
        .feat-item:hover .feat-title { color: var(--fg) !important; }

        /* ── Stack table ───────────────────────────────── */
        .stack-row { transition: background 0.2s; }
        .stack-row:hover { background: #0f172a !important; }

        /* ── Footer icons ──────────────────────────────── */
        .icon-link { color: var(--fg-muted); transition: color 0.2s, filter 0.2s; display: inline-flex; }
        .icon-link:hover { color: var(--cyan); filter: drop-shadow(0 0 6px var(--cyan-glow)); }

        /* ── Noise grain overlay ───────────────────────── */
        body::after {
          content: '';
          position: fixed; inset: 0;
          pointer-events: none; z-index: 9999; opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* ── Subtle radial hero glow ───────────────────── */
        .hero-glow {
          position: absolute;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 900px; height: 600px;
          background: radial-gradient(ellipse at center, rgba(0,217,255,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh" }}>

        {/* ─── HERO ─── */}
        <section style={{ position: "relative", overflow: "hidden", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 2.5rem", textAlign: "center" }}>
          <div className="hero-glow" />
          <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%", position: "relative" }}>

            <div className="rise eyebrow" style={{ marginBottom: "56px", justifyContent: "center" }}>
              Start holding yourself accountable
            </div>

            <h1 className="rise d1 fc" style={{
              fontSize: "clamp(72px, 13vw, 172px)",
              fontWeight: 300,
              lineHeight: 0.88,
              letterSpacing: "-0.02em",
              marginBottom: "72px",
              color: "var(--fg)",
            }}>
              The cost of<br />
              <em className="cyan-glow" style={{ fontStyle: "italic", color: "var(--cyan)", fontWeight: 400 }}>
                failure is real.
              </em>
            </h1>

            <div className="rise d2" style={{ display: "flex", justifyContent: "center" }}>
              <Link href="/login?mode=signup" className="btn-solid" style={{ fontSize: "13px", padding: "20px 120px", letterSpacing: "0.18em" }}>
                Begin Now
              </Link>
            </div>

          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section style={{ borderTop: "1px solid var(--border)", padding: "100px 2.5rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

            <div className="eyebrow" style={{ marginBottom: "72px" }}>The System</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "var(--border)" }}>
              {[
                { n: "01", title: "Commit",  badge: "PENDING",          cls: "badge-amber",   body: "Create a task. Set a deadline, a failure cost (EUR / USD / INR), and a voucher — the person who will verify you delivered." },
                { n: "02", title: "Execute", badge: "IN PROGRESS",       cls: "badge-cyan",    body: "Use the VFD clock–inspired Pomodoro timer to focus. Sessions are logged. Submit proof of completion before the deadline." },
                { n: "03", title: "Verify",  badge: "AWAITING VOUCHER",  cls: "badge-orange",  body: "Your voucher reviews the evidence and approves or denies. Denial triggers the failure cost against your monthly ledger." },
                { n: "04", title: "Settle",  badge: "SETTLED",           cls: "badge-purple",  body: "End-of-month: your ledger is calculated. Outstanding costs are tallied — and soon auto-debited to a charity of your choice." },
              ].map(({ n, title, badge, cls, body }) => (
                <div key={n} className="step-card" style={{ background: "var(--bg)", padding: "48px 40px", border: "1px solid transparent" }}>
                  <div className="step-num fc" style={{ fontSize: "76px", fontWeight: 300, color: "var(--border)", lineHeight: 1, marginBottom: "28px" }}>
                    {n}
                  </div>
                  <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <h3 className="fc" style={{ fontSize: "28px", fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em" }}>
                      {title}
                    </h3>
                    <span className={`badge ${cls}`}>{badge}</span>
                  </div>
                  <p className="fm" style={{ fontSize: "12px", lineHeight: 1.85, color: "var(--fg-dim)", fontWeight: 300 }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 2.5rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Contact strip — original layout, app colours */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px" }}>
              <span className="fm" style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-dim)" }}>
                Task Accountability System by{" "}
                <span style={{ color: "var(--fg)", fontWeight: 500 }}>Tarun Hariharan</span>
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <a href="mailto:tarun2k01@gmail.com" aria-label="Email" className="icon-link">
                  <Mail size={20} />
                </a>
                <a href="https://www.linkedin.com/in/tarun2k01" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="icon-link">
                  <Linkedin size={20} />
                </a>
                <a href="https://tarunh.com" target="_blank" rel="noopener noreferrer" aria-label="Personal Website" className="icon-link">
                  <Globe size={20} />
                </a>
              </div>
            </div>

            <BuildStamp />
          </div>
        </footer>

      </div>
    </>
  );
}
