import { Badge } from "@/components/ui/badge";
import { formatPomoBadge } from "@/lib/format-pomo";
import { Timer } from "lucide-react";

type VoucherPendingDisplayType = "ACTIVE" | "AWAITING_VOUCHER";
const responsiveBadgeSizeClass =
    "min-h-[clamp(20px,2.2vw,24px)] px-[clamp(10px,1.8vw,14px)] py-[clamp(2px,0.35vw,4px)] leading-none";

interface VoucherPendingStatusBadgeProps {
    pendingDisplayType: VoucherPendingDisplayType;
}

export function VoucherPendingStatusBadge({ pendingDisplayType }: VoucherPendingStatusBadgeProps) {
    const statusLabel = pendingDisplayType === "ACTIVE" ? "ACTIVE" : "AWAITING VOUCHER";
    const statusClass = pendingDisplayType === "ACTIVE"
        ? `bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px] ${responsiveBadgeSizeClass}`
        : `bg-amber-400/10 text-amber-400 border-amber-400/30 text-[10px] ${responsiveBadgeSizeClass}`;
    return (
        <Badge variant="outline" className={statusClass}>
            {statusLabel}
        </Badge>
    );
}

interface VoucherDeadlineBadgeProps {
    deadlineLabel: string;
    hasValidDeadline: boolean;
    hoursLeft: number;
}

export function VoucherDeadlineBadge({ deadlineLabel, hasValidDeadline, hoursLeft }: VoucherDeadlineBadgeProps) {
    const deadlineClass = !hasValidDeadline
        ? `bg-slate-500/10 text-slate-400 border-slate-500/20 text-[10px] ${responsiveBadgeSizeClass}`
        : (hoursLeft < 1
            ? `bg-red-500/10 text-red-500 border-red-500/30 text-[10px] ${responsiveBadgeSizeClass}`
            : `bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] ${responsiveBadgeSizeClass}`);
    return (
        <Badge variant="outline" className={deadlineClass}>
            {deadlineLabel}
        </Badge>
    );
}

interface VoucherPomoAccumulatedBadgeProps {
    totalSeconds: number;
}

export function VoucherPomoAccumulatedBadge({ totalSeconds }: VoucherPomoAccumulatedBadgeProps) {
    if (totalSeconds <= 0) return null;
    return (
        <Badge variant="outline" className={`bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] ${responsiveBadgeSizeClass}`}>
            <Timer className="h-3 w-3 mr-1" />
            {formatPomoBadge(totalSeconds)}
        </Badge>
    );
}

interface VoucherProofRequestBadgeProps {
    proofRequestCount: number;
}

export function VoucherProofRequestBadge({ proofRequestCount }: VoucherProofRequestBadgeProps) {
    if (proofRequestCount <= 0) return null;
    return (
        <Badge variant="outline" className={`bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] ${responsiveBadgeSizeClass}`}>
            {`?${proofRequestCount}`}
        </Badge>
    );
}
