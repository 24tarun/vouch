import type { CommitmentStatus } from "@/lib/types";

const PENDING_COMMITMENT_STORAGE_KEY = "vouch:pending-commitment:create";
const PENDING_COMMITMENT_EVENT = "vouch:pending-commitment:change";

export interface PendingCommitment {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: CommitmentStatus;
    created_at: string;
}

function isCommitmentStatus(value: unknown): value is CommitmentStatus {
    return value === "DRAFT" || value === "ACTIVE" || value === "COMPLETED" || value === "FAILED";
}

function isPendingCommitment(value: unknown): value is PendingCommitment {
    if (!value || typeof value !== "object") return false;
    const row = value as Partial<PendingCommitment>;
    return (
        typeof row.id === "string" &&
        typeof row.name === "string" &&
        typeof row.description === "string" &&
        typeof row.start_date === "string" &&
        typeof row.end_date === "string" &&
        isCommitmentStatus(row.status) &&
        typeof row.created_at === "string"
    );
}

function emitPendingCommitmentChange(value: PendingCommitment | null): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent<PendingCommitment | null>(PENDING_COMMITMENT_EVENT, {
            detail: value,
        })
    );
}

export function setPendingCommitment(value: PendingCommitment): void {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(PENDING_COMMITMENT_STORAGE_KEY, JSON.stringify(value));
    } catch {
        // Ignore storage write failures.
    }
    emitPendingCommitmentChange(value);
}

export function getPendingCommitment(): PendingCommitment | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.sessionStorage.getItem(PENDING_COMMITMENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        return isPendingCommitment(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function clearPendingCommitment(expectedId?: string): void {
    if (typeof window === "undefined") return;
    if (expectedId) {
        const current = getPendingCommitment();
        if (current && current.id !== expectedId) return;
    }
    try {
        window.sessionStorage.removeItem(PENDING_COMMITMENT_STORAGE_KEY);
    } catch {
        // Ignore storage write failures.
    }
    emitPendingCommitmentChange(null);
}

export function subscribePendingCommitment(
    handler: (value: PendingCommitment | null) => void
): () => void {
    if (typeof window === "undefined") {
        return () => {
            // Server-side no-op.
        };
    }

    const listener = (event: Event) => {
        const customEvent = event as CustomEvent<PendingCommitment | null>;
        if (customEvent.detail === undefined) {
            handler(getPendingCommitment());
            return;
        }
        handler(customEvent.detail);
    };

    window.addEventListener(PENDING_COMMITMENT_EVENT, listener as EventListener);
    return () => {
        window.removeEventListener(PENDING_COMMITMENT_EVENT, listener as EventListener);
    };
}
