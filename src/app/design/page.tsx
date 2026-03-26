import type { ReactNode } from "react";
import type { DayStatus } from "@/lib/commitment-status";
import type { CommitmentStatus } from "@/lib/types";
import type { TaskStatus } from "@/lib/xstate/task-machine";
import {
    TaskStatusBadge,
} from "@/components/tasks/TaskStatusBadge";
import {
    VoucherDeadlineBadge,
    VoucherPendingStatusBadge,
    VoucherPomoAccumulatedBadge,
    VoucherProofRequestBadge,
} from "@/components/voucher/VoucherBadges";
import { RecurringIndicator } from "@/components/tasks/RecurringIndicator";
import { LedgerEntryRow } from "@/components/ledger/LedgerEntryRow";
import { CommitmentStatusLabel } from "@/components/commitments/CommitmentStatusLabel";
import { CommitmentDayStrip } from "@/components/CommitmentDayStrip";

const PALETTE = [
    { name: "Slate 950", hex: "#020617", role: "Page background" },
    { name: "Slate 900", hex: "#0f172a", role: "Card / surface" },
    { name: "Slate 800", hex: "#1e293b", role: "Borders, inputs" },
    { name: "Slate 700", hex: "#334155", role: "Subtle borders, dividers" },
    { name: "Slate 600", hex: "#475569", role: "Muted icons, disabled" },
    { name: "Slate 500", hex: "#64748b", role: "Muted text, labels" },
    { name: "Slate 400", hex: "#94a3b8", role: "Secondary text" },
    { name: "Slate 300", hex: "#cbd5e1", role: "Body text" },
    { name: "Slate 200", hex: "#e2e8f0", role: "Hover text" },
    { name: "Slate 100", hex: "#f1f5f9", role: "Primary buttons" },
    { name: "White", hex: "#ffffff", role: "Headings, emphasis" },
];

type AccentColor = { name: string; hex: string; glow: string; role: string; proposed?: boolean };

const ACCENT_GROUPS: { group: string; colors: AccentColor[] }[] = [
    {
        group: "Blues",
        colors: [
            { name: "Blue 400", hex: "#60a5fa", glow: "rgba(96,165,250,0.6)", role: "Active tasks, primary actions" },
            { name: "Plasma Blue", hex: "#0066FF", glow: "rgba(0,102,255,0.8)", role: "Deep focus mode, immersive states, POSTPONED badge mapping (4.2 -> 2.2)", proposed: true },
            { name: "Indigo 700", hex: "#4338ca", glow: "rgba(67,56,202,0.7)", role: "Deep links, navigation highlights", proposed: true },
        ],
    },
    {
        group: "Cyans",
        colors: [
            { name: "Cyan 400", hex: "#22d3ee", glow: "rgba(34,211,238,0.6)", role: "VFD Pomodoro, time focused, commitments, settled status dot" },
        ],
    },
    {
        group: "Greens",
        colors: [
            { name: "Emerald 400", hex: "#34d399", glow: "rgba(52,211,153,0.5)", role: "Accept / complete actions, voucher accept" },
            { name: "Green 400", hex: "#4ade80", glow: "rgba(74,222,128,0.6)", role: "Cost saved, ledger reversal" },
            { name: "Acid Green", hex: "#39FF14", glow: "rgba(57,255,20,0.7)", role: "Live pulse, heartbeat, online status", proposed: true },
            { name: "Venom Green", hex: "#00FF66", glow: "rgba(0,255,102,0.7)", role: "Perfect score, flawless completion", proposed: true },
        ],
    },
    {
        group: "Yellows & Ambers",
        colors: [
            { name: "Amber 400", hex: "#fbbf24", glow: "rgba(251,191,36,0.4)", role: "Postponed, pending, warnings, escalated" },
        ],
    },
    {
        group: "Oranges",
        colors: [
            { name: "Orange 400", hex: "#fb923c", glow: "rgba(251,146,60,0.6)", role: "Rectify passes, timeout penalty" },
            { name: "Orange 500", hex: "#f97316", glow: "rgba(249,115,22,0.6)", role: "Rectified status" },
            { name: "Solar Flare", hex: "#FF6600", glow: "rgba(255,102,0,0.8)", role: "Override, urgent escalation, time running out", proposed: true },
        ],
    },
    {
        group: "Reds",
        colors: [
            { name: "Red 500", hex: "#ef4444", glow: "rgba(239,68,68,0.6)", role: "Failures, denials, destructive" },
            { name: "Blaze Red", hex: "#FF1744", glow: "rgba(255,23,68,0.8)", role: "Account danger, irreversible actions", proposed: true },
            { name: "Molten Lava", hex: "#FF3300", glow: "rgba(255,51,0,0.7)", role: "Deadline breach, critical overdue", proposed: true },
        ],
    },
    {
        group: "Pinks & Magentas",
        colors: [
            { name: "Pink 500", hex: "#ec4899", glow: "rgba(236,72,153,0.6)", role: "Projected donation amount" },
            { name: "Fuchsia 700", hex: "#a21caf", glow: "rgba(162,28,175,0.7)", role: "AI actions, magic wand, automation", proposed: true },
        ],
    },
    {
        group: "Purples & Violets",
        colors: [
            { name: "Purple 400", hex: "#c084fc", glow: "rgba(192,132,252,0.6)", role: "Recurrence, pending vouch" },
            { name: "Hot Violet", hex: "#9B00FF", glow: "rgba(155,0,255,0.7)", role: "Power-ups, rare achievements", proposed: true },
        ],
    },
];

const TASK_STATUS_GROUPS: {
    group: string;
    description: string;
    statuses: TaskStatus[];
}[] = [
    {
        group: "Active",
        description: "Task is live and counting down to its deadline.",
        statuses: ["ACTIVE", "POSTPONED"],
    },
    {
        group: "Pending Review",
        description: "Owner marked complete, waiting for voucher or AI to respond.",
        statuses: ["MARKED_COMPLETE", "AWAITING_VOUCHER", "AWAITING_ORCA", "AWAITING_USER", "ESCALATED"],
    },
    {
        group: "Terminal",
        description: "Final states. Task lifecycle is over - accepted, denied, missed, rectified, settled, or deleted.",
        statuses: ["ACCEPTED", "AUTO_ACCEPTED", "ORCA_ACCEPTED", "DENIED", "MISSED", "RECTIFIED", "SETTLED", "DELETED"],
    },
];

const COMMITMENT_STATUSES: { status: CommitmentStatus; label: string }[] = [
    { status: "DRAFT", label: "Not yet activated" },
    { status: "ACTIVE", label: "In progress" },
    { status: "COMPLETED", label: "All tasks passed" },
    { status: "FAILED", label: "One or more tasks failed" },
];

const LEDGER_TYPES: {
    id: string;
    entryType: string;
    taskStatus?: string;
    amountCents: number;
    description: string;
}[] = [
    { id: "denied", entryType: "failure", taskStatus: "DENIED", amountCents: 500, description: "Charged when a voucher denies the task" },
    { id: "missed", entryType: "failure", taskStatus: "MISSED", amountCents: 500, description: "Charged when a task misses its deadline" },
    { id: "rectified", entryType: "rectified", amountCents: -500, description: "Reversal when voucher authorises a rectification" },
    { id: "timeout", entryType: "voucher_timeout_penalty", amountCents: 30, description: "Charged to voucher for not responding in time" },
    { id: "override", entryType: "override", amountCents: -500, description: "Owner override that cancels a failure charge" },
];

const DAY_STATUS_LABELS: { status: DayStatus | "selected" | "current"; label: string }[] = [
    { status: "selected", label: "Selected" },
    { status: "current", label: "Current" },
    { status: "passed", label: "Passed" },
    { status: "failed", label: "Failed" },
    { status: "pending", label: "Pending" },
    { status: "future", label: "Future" },
];

const STAT_GLOWS: { label: string; textClass: string; glow: string }[] = [
    { label: "Active", textClass: "text-blue-400", glow: "0 0 8px rgba(96,165,250,0.6)" },
    { label: "Time Focused", textClass: "text-cyan-400", glow: "0 0 8px rgba(34,211,238,0.6)" },
    { label: "Pending Vouch", textClass: "text-purple-400", glow: "0 0 8px rgba(192,132,252,0.6)" },
    { label: "Accepted", textClass: "text-lime-300", glow: "0 0 8px rgba(190,242,100,0.6)" },
    { label: "Failed", textClass: "text-red-500", glow: "0 0 8px rgba(239,68,68,0.6)" },
    { label: "Projected", textClass: "text-pink-500", glow: "0 0 8px rgba(236,72,153,0.6)" },
    { label: "Rectify Passes", textClass: "text-orange-400", glow: "0 0 8px rgba(251,146,60,0.6)" },
    { label: "Kept", textClass: "text-green-400", glow: "0 0 8px rgba(74,222,128,0.6)" },
];

function SectionTitle({ children }: { children: ReactNode }) {
    return <h2 className="text-2xl font-semibold text-white border-b border-slate-800 pb-3">{children}</h2>;
}

function SectionDescription({ children }: { children: ReactNode }) {
    return <p className="text-sm text-slate-500 leading-relaxed">{children}</p>;
}

function toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function addDays(base: Date, offset: number): Date {
    const next = new Date(base);
    next.setUTCDate(next.getUTCDate() + offset);
    return next;
}

function sectionItemLabel(section: number, item: number): string {
    return `${section}.${item}`;
}

export default function DesignPage() {
    const today = new Date();
    const stripStart = toDateOnly(addDays(today, -4));
    const stripEnd = toDateOnly(addDays(today, 2));
    const selectedDate = toDateOnly(addDays(today, -2));
    const stripDayStatuses: { date: string; status: DayStatus }[] = [
        { date: toDateOnly(addDays(today, -4)), status: "passed" },
        { date: toDateOnly(addDays(today, -3)), status: "pending" },
        { date: toDateOnly(addDays(today, -2)), status: "failed" },
        { date: toDateOnly(addDays(today, -1)), status: "passed" },
    ];
    const section4StatusCount = TASK_STATUS_GROUPS.reduce((sum, group) => sum + group.statuses.length, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-20 pb-32 px-6 md:px-0 pt-16">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-white tracking-tight">Design System</h1>
                <p className="text-sm text-slate-500 max-w-lg">
                    The complete visual language for Vouch. Colour palette, accent tokens, glow effects,
                    status systems, badge components, ledger rows, commitment components, and typography.
                </p>
            </div>

            <section className="space-y-6">
                <SectionTitle>1. Slate Palette</SectionTitle>
                <SectionDescription>
                    The foundation of all surfaces, text, and borders. Dark-first scale from 950 (page background) to white (headings).
                </SectionDescription>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PALETTE.map((s, index) => (
                        <div key={s.name} className="flex items-center gap-4 py-3 px-4">
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {sectionItemLabel(1, index + 1)}
                            </span>
                            <div className="h-12 w-12 rounded-lg shrink-0" style={{ backgroundColor: s.hex }} />
                            <div className="min-w-0">
                                <p className="text-sm font-mono" style={{ color: s.hex }}>{s.name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{s.hex}</p>
                                <p className="text-[10px] text-slate-600 mt-0.5">{s.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>2. Accent Colours</SectionTitle>
                <SectionDescription>
                    All accent colours grouped by hue family. Active colours are in use today;
                    proposed colours (marked with a tag) are candidates for future features.
                </SectionDescription>

                <div className="space-y-10">
                    {ACCENT_GROUPS.map((group, groupIndex) => (
                        <div key={group.group} className="space-y-3">
                            <h3 className="text-base font-semibold text-slate-200">{group.group}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {group.colors.map((a, colorIndex) => {
                                    const priorGroupsCount = ACCENT_GROUPS
                                        .slice(0, groupIndex)
                                        .reduce((sum, currentGroup) => sum + currentGroup.colors.length, 0);
                                    const itemIndex = priorGroupsCount + colorIndex + 1;
                                    return (
                                    <div key={a.name} className="flex items-center gap-4 py-3 px-4">
                                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                            {sectionItemLabel(2, itemIndex)}
                                        </span>
                                        <div className="h-12 w-12 rounded-lg shrink-0" style={{ backgroundColor: a.hex, boxShadow: `0 0 14px ${a.glow}` }} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-mono" style={{ color: a.hex }}>{a.name}</p>
                                                {a.proposed && (
                                                    <span className="text-[8px] uppercase tracking-widest text-slate-600 border border-slate-800 rounded-full px-1 py-0.5">proposed</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-mono">{a.hex}</p>
                                            <p className="text-[10px] text-slate-600 mt-0.5">{a.role}</p>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>3. Stat Metric Glows</SectionTitle>
                <SectionDescription>
                    Large numbers on the stats and ledger pages use a matching drop-shadow glow to reinforce their meaning at a glance.
                </SectionDescription>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-2">
                    {STAT_GLOWS.map((g, index) => (
                        <div key={g.label} className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                <span className="mr-2 font-mono normal-case">{sectionItemLabel(3, index + 1)}</span>
                                {g.label}
                            </p>
                            <p className={`text-4xl font-light ${g.textClass}`} style={{ filter: `drop-shadow(${g.glow})` }}>
                                42
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>4. Status Badges</SectionTitle>
                <SectionDescription>
                    Combined status badge library. All statuses are rendered as curved pill badges from live components.
                </SectionDescription>

                <div className="space-y-10">
                    {TASK_STATUS_GROUPS.map((group, groupIndex) => (
                        <div key={group.group} className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-200">{group.group}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.statuses.map((status, index) => {
                                    const priorGroupsCount = TASK_STATUS_GROUPS
                                        .slice(0, groupIndex)
                                        .reduce((sum, currentGroup) => sum + currentGroup.statuses.length, 0);
                                    const itemIndex = priorGroupsCount + index + 1;
                                    return (
                                    <div key={status} className="flex items-center gap-3 py-3 px-4">
                                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                            {sectionItemLabel(4, itemIndex)}
                                        </span>
                                        <TaskStatusBadge status={status} />
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-200">Workflow Badges</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Voucher and task-side badges reused from live surfaces.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {[
                                <VoucherPendingStatusBadge key="active" pendingDisplayType="ACTIVE" />,
                                <VoucherPendingStatusBadge key="awaiting-voucher" pendingDisplayType="AWAITING_VOUCHER" />,
                                <VoucherDeadlineBadge key="deadline-urgent" deadlineLabel="27/03/26, 23:59" hasValidDeadline hoursLeft={0} />,
                                <VoucherDeadlineBadge key="deadline-standard" deadlineLabel="28/03/26, 02:15" hasValidDeadline hoursLeft={3} />,
                                <VoucherDeadlineBadge key="deadline-none" deadlineLabel="No deadline" hasValidDeadline={false} hoursLeft={Number.POSITIVE_INFINITY} />,
                                <VoucherProofRequestBadge key="proof-request" proofRequestCount={1} />,
                                <VoucherPomoAccumulatedBadge key="pomo-accum" totalSeconds={3600} />,
                                <RecurringIndicator key="recurring" />,
                            ].map((badge, index) => (
                                <div key={`workflow-${index + 1}`} className="flex items-center gap-3 py-3 px-4">
                                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                        {sectionItemLabel(4, section4StatusCount + index + 1)}
                                    </span>
                                    {badge}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>5. Ledger Entry Types</SectionTitle>
                <SectionDescription>
                    Uses the same ledger row component as the live ledger screens.
                </SectionDescription>
                <div className="flex flex-col pt-2">
                    {LEDGER_TYPES.map((entry, index) => (
                        <div key={entry.id}>
                            <p className="text-[10px] font-mono text-slate-500 px-4 pb-1">
                                {sectionItemLabel(5, index + 1)}
                            </p>
                            <LedgerEntryRow
                                title="Sample task title"
                                entryType={entry.entryType}
                                taskStatus={entry.taskStatus}
                                createdAt={new Date().toISOString()}
                                amountCents={entry.amountCents}
                                currency="EUR"
                            />
                            <p className="text-[10px] text-slate-600 px-4 pb-4">{entry.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>6. Commitment Statuses</SectionTitle>
                <SectionDescription>
                    Uses the same commitment status label component as commitment cards.
                </SectionDescription>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
                    {COMMITMENT_STATUSES.map((c, index) => (
                        <div key={c.status} className="space-y-2 py-3 px-4">
                            <p className="text-[10px] font-mono text-slate-500">{sectionItemLabel(6, index + 1)}</p>
                            <CommitmentStatusLabel status={c.status} className="text-2xl font-light" />
                            <p className="text-[10px] text-slate-600">{c.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>7. Commitment Day Strip</SectionTitle>
                <SectionDescription>
                    Uses the real CommitmentDayStrip component with sample day-status data.
                </SectionDescription>
                <div className="pt-2">
                    <CommitmentDayStrip
                        startDate={stripStart}
                        endDate={stripEnd}
                        dayStatuses={stripDayStatuses}
                        selectedDate={selectedDate}
                    />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {DAY_STATUS_LABELS.map((item, index) => (
                        <span key={item.status} className="text-[10px] uppercase tracking-wider text-slate-500">
                            {sectionItemLabel(7, index + 1)} {item.label}
                        </span>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <SectionTitle>8. Typography</SectionTitle>
                <SectionDescription>
                    Text styles used across the app. System font stack for UI, monospace for data and metrics.
                </SectionDescription>
                <div className="space-y-6 pt-2">
                    {[
                        { sample: "Page Title", className: "text-3xl font-bold text-white", spec: "text-3xl / bold / white" },
                        { sample: "Section Heading", className: "text-xl font-semibold text-white", spec: "text-xl / semibold / white" },
                        { sample: "Body text for descriptions and content", className: "text-sm text-slate-300", spec: "text-sm / slate-300" },
                        { sample: "Secondary information and hints", className: "text-xs text-slate-400", spec: "text-xs / slate-400" },
                        { sample: "STAT LABEL", className: "text-[10px] uppercase tracking-wider font-bold text-slate-500", spec: "text-[10px] / uppercase / tracking-wider / bold / slate-500" },
                        { sample: "Muted timestamps and metadata", className: "text-xs text-slate-600", spec: "text-xs / slate-600" },
                        { sample: "14:30 26/03/2026", className: "text-sm font-mono text-slate-300", spec: "text-sm / font-mono / slate-300 (data)" },
                        { sample: "+42", className: "text-sm font-mono text-emerald-400", spec: "text-sm / font-mono / emerald-400 (positive metric)" },
                        { sample: "-5", className: "text-sm font-mono text-red-500", spec: "text-sm / font-mono / red-500 (negative metric)" },
                    ].map((t, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-6 py-2 border-b border-slate-900/50 last:border-0">
                            <p className={t.className}>{t.sample}</p>
                            <p className="text-[10px] text-slate-600 font-mono shrink-0 text-right">
                                {sectionItemLabel(8, i + 1)} {t.spec}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <p className="text-[10px] text-slate-700 text-center uppercase tracking-[0.2em] pt-12">
                Vouch Design System
            </p>
        </div>
    );
}
