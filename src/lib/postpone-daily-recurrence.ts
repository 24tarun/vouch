function isValidTimeZone(timeZone: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
        return true;
    } catch {
        return false;
    }
}

function getDatePartsInTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const map: Record<string, string> = {};
    for (const part of parts) {
        if (part.type !== "literal") {
            map[part.type] = part.value;
        }
    }

    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
    };
}

export function shouldRestrictDailyPostponeToSameRuleDay(ruleConfig: unknown): boolean {
    if (!ruleConfig || typeof ruleConfig !== "object") return false;
    const frequency = String((ruleConfig as { frequency?: unknown }).frequency ?? "").toUpperCase();
    return frequency === "DAILY";
}

export function canPostponeDailyRecurringTaskToDeadline(
    currentDeadline: Date,
    newDeadline: Date,
    recurrenceTimeZone?: string | null
): boolean {
    const safeTimeZone =
        typeof recurrenceTimeZone === "string" && isValidTimeZone(recurrenceTimeZone)
            ? recurrenceTimeZone
            : "UTC";

    const currentDay = getDatePartsInTimeZone(currentDeadline, safeTimeZone);
    const nextDay = getDatePartsInTimeZone(newDeadline, safeTimeZone);

    return (
        currentDay.year === nextDay.year &&
        currentDay.month === nextDay.month &&
        currentDay.day === nextDay.day
    );
}
