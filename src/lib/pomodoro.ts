import {
    DEFAULT_POMO_DURATION_MINUTES,
    MAX_POMO_DURATION_MINUTES,
} from "@/lib/constants";

export function isValidPomoDurationMinutes(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= MAX_POMO_DURATION_MINUTES
    );
}

export function normalizePomoDurationMinutes(
    value: unknown,
    fallback: number = DEFAULT_POMO_DURATION_MINUTES
): number {
    if (isValidPomoDurationMinutes(value)) {
        return value;
    }

    if (
        typeof value === "number" &&
        Number.isFinite(value) &&
        Number.isInteger(value) &&
        value >= 1
    ) {
        return Math.min(value, MAX_POMO_DURATION_MINUTES);
    }

    return fallback;
}

export function parseRequiredPomoFromTitle(text: string): {
    requiredPomoMinutes: number | null;
    error?: string;
} {
    const match = text.match(/\bpomo\s+(\d+)\b/i);
    if (!match) {
        return { requiredPomoMinutes: null };
    }

    const parsed = Number.parseInt(match[1], 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_POMO_DURATION_MINUTES) {
        return {
            requiredPomoMinutes: null,
            error: `Required Pomodoro minutes must be an integer between 1 and ${MAX_POMO_DURATION_MINUTES}.`,
        };
    }

    return { requiredPomoMinutes: parsed };
}
