"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { localDateTimeToIso, toDateTimeLocalValue } from "@/lib/datetime-local";

interface PostponeDeadlineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentDeadlineIso: string | null;
    isSubmitting?: boolean;
    onConfirm: (newDeadlineIso: string) => Promise<unknown> | unknown;
}

export function PostponeDeadlineDialog({
    open,
    onOpenChange,
    currentDeadlineIso,
    isSubmitting = false,
    onConfirm,
}: PostponeDeadlineDialogProps) {
    const dialogStateKey = `${currentDeadlineIso || "none"}:${open ? "open" : "closed"}`;
    const defaultDeadlineDraftValue = getDefaultDeadlineDraftValue(currentDeadlineIso);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isSubmitting && !nextOpen) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                showCloseButton={!isSubmitting}
                className="bg-slate-900 border-slate-800 text-slate-200 [&>[data-slot='dialog-close']]:text-slate-300 [&>[data-slot='dialog-close']]:opacity-100 [&>[data-slot='dialog-close']]:hover:text-white"
            >
                <PostponeDeadlineDialogBody
                    key={dialogStateKey}
                    defaultDeadlineDraftValue={defaultDeadlineDraftValue}
                    isSubmitting={isSubmitting}
                    onCancel={() => onOpenChange(false)}
                    onConfirm={onConfirm}
                />
            </DialogContent>
        </Dialog>
    );
}

function getDefaultDeadlineDraftValue(currentDeadlineIso: string | null): string {
    const currentDeadline = currentDeadlineIso ? new Date(currentDeadlineIso) : null;
    const baseDate =
        currentDeadline && !Number.isNaN(currentDeadline.getTime())
            ? new Date(currentDeadline.getTime() + 60 * 60 * 1000)
            : new Date(Date.now() + 60 * 60 * 1000);
    return toDateTimeLocalValue(baseDate);
}

function PostponeDeadlineDialogBody({
    defaultDeadlineDraftValue,
    isSubmitting,
    onCancel,
    onConfirm,
}: {
    defaultDeadlineDraftValue: string;
    isSubmitting: boolean;
    onCancel: () => void;
    onConfirm: (newDeadlineIso: string) => Promise<unknown> | unknown;
}) {
    const [deadlineDraftValue, setDeadlineDraftValue] = useState(defaultDeadlineDraftValue);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleApply = async () => {
        if (isSubmitting) return;

        const deadlineIso = localDateTimeToIso(deadlineDraftValue);
        if (!deadlineIso) {
            setValidationError("Please choose a valid date and time.");
            return;
        }

        const deadlineMs = new Date(deadlineIso).getTime();
        if (Number.isNaN(deadlineMs)) {
            setValidationError("Please choose a valid date and time.");
            return;
        }

        if (deadlineMs <= Date.now()) {
            setValidationError("Deadline must be in the future.");
            return;
        }

        setValidationError(null);
        await onConfirm(deadlineIso);
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-white">Postpone deadline</DialogTitle>
                <DialogDescription className="text-slate-400">
                    Choose a new deadline for this task.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">New deadline</label>
                <input
                    type="datetime-local"
                    value={deadlineDraftValue}
                    onChange={(e) => {
                        setDeadlineDraftValue(e.target.value);
                        if (validationError) {
                            setValidationError(null);
                        }
                    }}
                    disabled={isSubmitting}
                    className="h-9 w-full px-3 bg-slate-800/70 border border-slate-600 rounded-md text-white [color-scheme:dark] focus:outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-500"
                />
                {validationError && (
                    <p className="text-xs text-red-300">{validationError}</p>
                )}
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="h-9 bg-slate-800/80 border-slate-600 text-slate-100 hover:bg-slate-700/80 disabled:opacity-100 disabled:border-slate-800 disabled:bg-slate-900/50 disabled:text-slate-500"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                        void handleApply();
                    }}
                    disabled={isSubmitting || !deadlineDraftValue}
                    className="h-9 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 disabled:opacity-100 disabled:border-slate-800 disabled:bg-slate-900/50 disabled:text-slate-500"
                >
                    {isSubmitting ? "Postponing..." : "Postpone"}
                </Button>
            </DialogFooter>
        </>
    );
}
