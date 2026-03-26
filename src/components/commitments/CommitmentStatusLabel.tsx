import { cn } from "@/lib/utils";
import type { CommitmentStatus } from "@/lib/types";

interface CommitmentStatusLabelProps {
    status: CommitmentStatus;
    className?: string;
}

function statusStyle(status: CommitmentStatus): { className: string; glow: string } {
    if (status === "ACTIVE") {
        return { className: "text-cyan-400", glow: "0 0 6px rgba(34,211,238,0.5)" };
    }
    if (status === "COMPLETED") {
        return { className: "text-emerald-400", glow: "0 0 6px rgba(52,211,153,0.5)" };
    }
    if (status === "FAILED") {
        return { className: "text-red-400", glow: "0 0 6px rgba(248,113,113,0.5)" };
    }
    return { className: "text-slate-500", glow: "none" };
}

export function CommitmentStatusLabel({ status, className }: CommitmentStatusLabelProps) {
    const { className: toneClass, glow } = statusStyle(status);
    return (
        <span
            className={cn("shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest", toneClass, className)}
            style={{ textShadow: glow !== "none" ? glow : undefined }}
        >
            {status}
        </span>
    );
}
