"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FloatingTaskCreator } from "@/components/task-creator-variants/FloatingTaskCreator";
import type { Profile } from "@/lib/types";

interface PreviewClientProps {
    friends: Profile[];
    selfUserId: string;
    defaultFailureCost: number;
}

export function PreviewClient({ friends, selfUserId, defaultFailureCost }: PreviewClientProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-5">
            <div className="max-w-lg mx-auto pb-32">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-700 mb-1">ui preview</p>
                <h1 className="text-2xl font-bold text-white mb-1">Task Creator</h1>

                {[
                    "Finish the landing page redesign",
                    "Review PR from Alex",
                    "Write weekly standup notes",
                    "Pay electricity bill",
                ].map((t, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
                        <div className="h-5 w-5 rounded-full border border-slate-700 shrink-0" />
                        <span className="text-sm text-slate-400 flex-1">{t}</span>
                        <span className="text-xs text-slate-700 font-mono shrink-0">23:59</span>
                    </div>
                ))}
            </div>

            {/* FAB */}
            <button
                onClick={() => setOpen(true)}
                aria-label="Create task"
                className="fixed bottom-8 right-4 h-14 w-14 rounded-full bg-emerald-500 shadow-xl flex items-center justify-center transition-all active:scale-95"
            >
                <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
            </button>

            <FloatingTaskCreator
                isOpen={open}
                onClose={() => setOpen(false)}
                friends={friends}
                selfUserId={selfUserId}
                defaultFailureCost={defaultFailureCost}
            />
        </div>
    );
}
