import { getBuildInfo } from "@/lib/build-info";

interface BuildStampProps {
    className?: string;
}

export function BuildStamp({ className }: BuildStampProps) {
    const { label } = getBuildInfo();

    return (
        <p className={className ?? "text-[10px] tracking-[0.04em] text-slate-600 font-mono"}>
            {label}
        </p>
    );
}
