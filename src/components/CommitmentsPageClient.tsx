"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommitmentCard } from "@/components/CommitmentCard";
import { fireCommitmentConfetti } from "@/lib/confetti";
import {
    type RealtimeCommitmentChange,
    subscribeRealtimeCommitmentChanges,
    subscribeRealtimeTaskChanges,
} from "@/lib/realtime-task-events";
import type { CommitmentListItem } from "@/actions/commitments";
import type { SupportedCurrency } from "@/lib/currency";

interface CommitmentsPageClientProps {
    commitments: CommitmentListItem[];
    currency: SupportedCurrency;
}

const NEW_COMMITMENT_HREF = "/dashboard/commitments/new";

type IdleWindow = Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
};

function normalizeCommitmentStatus(
    value: string,
    fallback: CommitmentListItem["status"]
): CommitmentListItem["status"] {
    if (value === "DRAFT" || value === "ACTIVE" || value === "COMPLETED" || value === "FAILED") {
        return value;
    }
    return fallback;
}

function getSortRank(status: string): number {
    if (status === "ACTIVE") return 0;
    if (status === "DRAFT") return 1;
    if (status === "COMPLETED") return 2;
    if (status === "FAILED") return 3;
    return 4;
}

export function CommitmentsPageClient({ commitments, currency }: CommitmentsPageClientProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [optimisticCommitments, setOptimisticCommitments] = useState(commitments);
    const previousStatusByIdRef = useRef<Map<string, string>>(new Map());
    const prefetchedCreateRouteRef = useRef(false);

    const prefetchCreateRoute = useCallback(() => {
        if (prefetchedCreateRouteRef.current) return;
        prefetchedCreateRouteRef.current = true;
        void router.prefetch(NEW_COMMITMENT_HREF);
    }, [router]);

    useEffect(() => {
        setOptimisticCommitments(commitments);
    }, [commitments]);

    useEffect(() => {
        const idleWindow = window as IdleWindow;
        let timeoutId: number | null = null;
        let idleId: number | null = null;

        const warmup = () => {
            prefetchCreateRoute();
        };

        if (idleWindow.requestIdleCallback) {
            idleId = idleWindow.requestIdleCallback(warmup, { timeout: 1200 });
        } else {
            timeoutId = window.setTimeout(warmup, 220);
        }

        return () => {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            if (idleId !== null && idleWindow.cancelIdleCallback) {
                idleWindow.cancelIdleCallback(idleId);
            }
        };
    }, [prefetchCreateRoute]);

    const applyOptimisticCommitmentPatch = useCallback((change: RealtimeCommitmentChange) => {
        setOptimisticCommitments((previous) => {
            const incoming = change.newRow || change.oldRow;
            if (!incoming) return previous;

            if (change.eventType === "DELETE") {
                return previous.filter((commitment) => commitment.id !== incoming.id);
            }

            if (change.eventType !== "UPDATE") {
                return previous;
            }

            return previous.map((commitment) => {
                if (commitment.id !== incoming.id) return commitment;
                const nextStatus = normalizeCommitmentStatus(incoming.status, commitment.status);
                return {
                    ...commitment,
                    name: incoming.name,
                    description: incoming.description,
                    status: nextStatus,
                    derived_status: nextStatus,
                    start_date: incoming.start_date,
                    end_date: incoming.end_date,
                    updated_at: incoming.updated_at,
                };
            });
        });
    }, []);

    const handleOptimisticAbandon = useCallback((commitmentId: string) => {
        setOptimisticCommitments((previous) => previous.filter((commitment) => commitment.id !== commitmentId));
    }, []);

    const handleAbandonRollback = useCallback((commitment: CommitmentListItem) => {
        setOptimisticCommitments((previous) => {
            if (previous.some((item) => item.id === commitment.id)) return previous;
            return [...previous, commitment];
        });
    }, []);

    const sortedCommitments = useMemo(() => {
        return [...optimisticCommitments].sort((a, b) => {
            const rankDiff = getSortRank(a.derived_status || a.status) - getSortRank(b.derived_status || b.status);
            if (rankDiff !== 0) return rankDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [optimisticCommitments]);

    useEffect(() => {
        const nextMap = new Map<string, string>();
        for (const commitment of sortedCommitments) {
            const currentStatus = commitment.derived_status || commitment.status;
            const previousStatus = previousStatusByIdRef.current.get(commitment.id);
            if (previousStatus && previousStatus !== "COMPLETED" && currentStatus === "COMPLETED") {
                fireCommitmentConfetti();
            }
            nextMap.set(commitment.id, currentStatus);
        }
        previousStatusByIdRef.current = nextMap;
    }, [sortedCommitments]);

    useEffect(() => {
        const refresh = () => {
            startTransition(() => {
                router.refresh();
            });
        };

        // Task changes affect commitment derived status; refresh server data.
        const unsubTask = subscribeRealtimeTaskChanges(refresh);
        // Commitment row changes: apply patch immediately, then confirm with server
        const unsubCommitment = subscribeRealtimeCommitmentChanges((change) => {
            applyOptimisticCommitmentPatch(change);
            refresh();
        });

        return () => {
            unsubTask();
            unsubCommitment();
        };
    }, [applyOptimisticCommitmentPatch, router, startTransition]);

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-0">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-white">Commitments</h1>
                    <p className="mt-1 text-sm text-slate-400">Create a commitment for days, whatever amount you Keep is justified because you earnt it by diligently doing your tasks</p>
                </div>
                <Button asChild className="bg-blue-600/30 border border-blue-500/40 text-blue-200 hover:bg-blue-600/40">
                    <Link
                        href={NEW_COMMITMENT_HREF}
                        prefetch
                        onMouseEnter={prefetchCreateRoute}
                        onFocus={prefetchCreateRoute}
                        onTouchStart={prefetchCreateRoute}
                    >
                        New Commitment
                    </Link>
                </Button>
            </div>

            {sortedCommitments.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center">
                    <p className="text-slate-300">No commitments yet.</p>
                    <p className="mt-2 text-sm text-slate-500">Create one and link tasks to start tracking your streak value.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {sortedCommitments.map((commitment) => (
                        <CommitmentCard
                            key={commitment.id}
                            commitment={commitment}
                            currency={currency}
                            onOptimisticAbandon={handleOptimisticAbandon}
                            onAbandonRollback={handleAbandonRollback}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

