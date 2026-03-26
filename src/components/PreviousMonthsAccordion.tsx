"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getLedgerEntriesForPeriod } from "@/actions/ledger";
import { formatCurrencyFromCents, type SupportedCurrency } from "@/lib/currency";
import { LedgerEntryRow } from "@/components/ledger/LedgerEntryRow";

interface Props {
    periods: string[];
    currency: SupportedCurrency;
}

function formatPeriodLabel(period: string): string {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
}

interface MonthData {
    entries: any[];
    totalCents: number;
}

export function PreviousMonthsAccordion({ periods, currency }: Props) {
    const [open, setOpen] = useState<string | null>(null);
    const [cache, setCache] = useState<Record<string, MonthData>>({});
    const [isPending, startTransition] = useTransition();
    const [loadingPeriod, setLoadingPeriod] = useState<string | null>(null);

    function toggle(period: string) {
        if (open === period) {
            setOpen(null);
            return;
        }
        setOpen(period);
        if (!cache[period]) {
            setLoadingPeriod(period);
            startTransition(async () => {
                const data = await getLedgerEntriesForPeriod(period);
                setCache((prev) => ({ ...prev, [period]: data }));
                setLoadingPeriod(null);
            });
        }
    }

    if (periods.length === 0) return null;

    return (
        <section className="space-y-2">
            <div className="border-b border-slate-900 pb-2">
                <h2 className="text-xl font-semibold text-slate-500">Previous Months</h2>
            </div>

            <div className="flex flex-col">
                {periods.map((period) => {
                    const isOpen = open === period;
                    const isLoading = loadingPeriod === period && isPending;
                    const data = cache[period];
                    const label = formatPeriodLabel(period);

                    return (
                        <div key={period} className="border-b border-slate-900 last:border-0">
                            <button
                                onClick={() => toggle(period)}
                                className="w-full flex items-center justify-between py-4 text-left hover:bg-slate-900/10 -mx-4 px-4 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isOpen
                                        ? <ChevronDown className="h-4 w-4 text-slate-500" />
                                        : <ChevronRight className="h-4 w-4 text-slate-500" />
                                    }
                                    <span className="text-slate-300 font-medium">{label}</span>
                                </div>
                                {data && (
                                    <span className={`text-sm font-mono ${data.totalCents > 0 ? "text-red-500" : data.totalCents < 0 ? "text-green-500" : "text-slate-500"}`}>
                                        {data.totalCents > 0 ? "+" : ""}{formatCurrencyFromCents(data.totalCents, currency)}
                                    </span>
                                )}
                                {isLoading && (
                                    <span className="text-xs text-slate-600 animate-pulse">Loading…</span>
                                )}
                            </button>

                            {isOpen && data && (
                                <div className="flex flex-col pb-2">
                                    {data.entries.length === 0 ? (
                                        <p className="text-slate-600 text-sm italic py-4 px-4">No entries for this period.</p>
                                    ) : (
                                        data.entries.map((entry: any) => {
                                            const taskId = entry.task?.id || entry.task_id || null;
                                            return (
                                                <LedgerEntryRow
                                                    key={entry.id}
                                                    id={entry.id}
                                                    title={entry.task?.title || "Accountability Adjustment"}
                                                    entryType={entry.entry_type}
                                                    taskStatus={entry.task?.status}
                                                    createdAt={entry.created_at}
                                                    amountCents={entry.amount_cents}
                                                    currency={currency}
                                                    taskHref={taskId ? `/tasks/${taskId}` : null}
                                                    compact
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
