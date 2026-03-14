const WEEKDAY_TOKEN_PATTERN =
    "\\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\\b";

export const WEEKDAY_TOKEN_REGEX = new RegExp(WEEKDAY_TOKEN_PATTERN, "gi");

export interface WeekdayTokenMatch {
    token: string;
    weekday: number;
    index: number;
}

function mapWeekdayTokenToIndex(token: string): number {
    const normalized = token.toLowerCase();
    if (normalized.startsWith("mon")) return 1;
    if (normalized.startsWith("tue")) return 2;
    if (normalized.startsWith("wed")) return 3;
    if (normalized.startsWith("thu")) return 4;
    if (normalized.startsWith("fri")) return 5;
    if (normalized.startsWith("sat")) return 6;
    return 0;
}

export function extractWeekdayDateTokens(text: string): WeekdayTokenMatch[] {
    const matches: WeekdayTokenMatch[] = [];
    const regex = new RegExp(WEEKDAY_TOKEN_PATTERN, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        matches.push({
            token: match[1],
            weekday: mapWeekdayTokenToIndex(match[1]),
            index: match.index,
        });
    }

    return matches.sort((a, b) => a.index - b.index);
}

export function resolveUpcomingWeekdayDate(targetWeekday: number, now: Date): Date {
    const offset = (targetWeekday - now.getDay() + 7) % 7;
    const resolved = new Date(now);
    resolved.setDate(resolved.getDate() + offset);
    return resolved;
}

