const EVENT_TOKEN_REGEX = /(^|\s)-event(?=\s|$)/i;
const EVENT_START_TOKEN_REGEX = /(^|\s)-start\s*(\d{1,2}:\d{2}|\d{1,4})\b/gi;
const EVENT_END_TOKEN_REGEX = /(^|\s)-end\s*(\d{1,2}:\d{2}|\d{1,4})\b/gi;

const EVENT_DUPLICATE_START_ERROR = "Use only one -start token.";
const EVENT_DUPLICATE_END_ERROR = "Use only one -end token.";
const EVENT_MISSING_TIME_ERROR = "Event tasks require -startHHMM or -endHHMM.";
const EVENT_START_INVALID_ERROR = "Event start time is invalid. Use -start930 or -start09:30.";
const EVENT_END_INVALID_ERROR = "Event end time is invalid. Use -end930 or -end15:00.";
const EVENT_END_BEFORE_START_ERROR = "Event end time must be after start time.";

export interface ParsedClockToken {
    hours: number;
    minutes: number;
}

export interface ExtractedEventTokens {
    hasEvent: boolean;
    startToken?: string;
    endToken?: string;
    errors: string[];
}

export interface ResolveEventScheduleOptions {
    rawTitle: string;
    anchorDate: Date;
    defaultDurationMinutes: number;
    now?: Date;
}

export interface ResolveEventScheduleResult {
    hasEvent: boolean;
    startDate: Date | null;
    endDate: Date | null;
    error?: string;
}

export function parseClockToken(raw: string): ParsedClockToken | null {
    const normalized = raw.trim();
    let hours = Number.NaN;
    let minutes = Number.NaN;

    const colonMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (colonMatch) {
        hours = Number.parseInt(colonMatch[1], 10);
        minutes = Number.parseInt(colonMatch[2], 10);
    } else {
        const compactFourMatch = normalized.match(/^(\d{4})$/);
        if (compactFourMatch) {
            hours = Number.parseInt(compactFourMatch[1].slice(0, 2), 10);
            minutes = Number.parseInt(compactFourMatch[1].slice(2, 4), 10);
        } else {
            const compactThreeMatch = normalized.match(/^(\d{3})$/);
            if (compactThreeMatch) {
                hours = Number.parseInt(compactThreeMatch[1].slice(0, 1), 10);
                minutes = Number.parseInt(compactThreeMatch[1].slice(1, 3), 10);
            } else {
                const hourOnlyMatch = normalized.match(/^(\d{1,2})$/);
                if (hourOnlyMatch) {
                    hours = Number.parseInt(hourOnlyMatch[1], 10);
                    minutes = 0;
                }
            }
        }
    }

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
}

export function extractEventTokens(rawTitle: string): ExtractedEventTokens {
    const hasEvent = EVENT_TOKEN_REGEX.test(rawTitle);
    const errors: string[] = [];
    let startToken: string | undefined;
    let endToken: string | undefined;

    const startRegex = new RegExp(EVENT_START_TOKEN_REGEX.source, "gi");
    const endRegex = new RegExp(EVENT_END_TOKEN_REGEX.source, "gi");

    const startMatches = Array.from(rawTitle.matchAll(startRegex));
    const endMatches = Array.from(rawTitle.matchAll(endRegex));

    if (startMatches.length > 1) {
        errors.push(EVENT_DUPLICATE_START_ERROR);
    } else if (startMatches.length === 1) {
        startToken = startMatches[0][2];
    }

    if (endMatches.length > 1) {
        errors.push(EVENT_DUPLICATE_END_ERROR);
    } else if (endMatches.length === 1) {
        endToken = endMatches[0][2];
    }

    return {
        hasEvent,
        startToken,
        endToken,
        errors,
    };
}

function applyClockToken(baseDate: Date, token: ParsedClockToken): Date {
    const next = new Date(baseDate);
    next.setHours(token.hours, token.minutes, 0, 0);
    return next;
}

export function resolveEventSchedule(options: ResolveEventScheduleOptions): ResolveEventScheduleResult {
    const { rawTitle, anchorDate, defaultDurationMinutes } = options;

    if (
        !(anchorDate instanceof Date) ||
        Number.isNaN(anchorDate.getTime()) ||
        !Number.isInteger(defaultDurationMinutes) ||
        defaultDurationMinutes < 1
    ) {
        return {
            hasEvent: false,
            startDate: null,
            endDate: null,
            error: EVENT_START_INVALID_ERROR,
        };
    }

    const extracted = extractEventTokens(rawTitle);
    if (!extracted.hasEvent) {
        return {
            hasEvent: false,
            startDate: null,
            endDate: null,
        };
    }

    if (extracted.errors.length > 0) {
        return {
            hasEvent: true,
            startDate: null,
            endDate: null,
            error: extracted.errors[0],
        };
    }

    if (!extracted.startToken && !extracted.endToken) {
        return {
            hasEvent: true,
            startDate: null,
            endDate: null,
            error: EVENT_MISSING_TIME_ERROR,
        };
    }

    const parsedStart = extracted.startToken ? parseClockToken(extracted.startToken) : null;
    const parsedEnd = extracted.endToken ? parseClockToken(extracted.endToken) : null;

    if (extracted.startToken && !parsedStart) {
        return {
            hasEvent: true,
            startDate: null,
            endDate: null,
            error: EVENT_START_INVALID_ERROR,
        };
    }

    if (extracted.endToken && !parsedEnd) {
        return {
            hasEvent: true,
            startDate: null,
            endDate: null,
            error: EVENT_END_INVALID_ERROR,
        };
    }

    let startDate: Date;
    let endDate: Date;

    if (parsedStart && parsedEnd) {
        startDate = applyClockToken(anchorDate, parsedStart);
        endDate = applyClockToken(anchorDate, parsedEnd);
    } else if (parsedStart) {
        startDate = applyClockToken(anchorDate, parsedStart);
        endDate = new Date(startDate.getTime() + defaultDurationMinutes * 60 * 1000);
    } else if (parsedEnd) {
        endDate = applyClockToken(anchorDate, parsedEnd);
        startDate = new Date(endDate.getTime() - defaultDurationMinutes * 60 * 1000);
    } else {
        return {
            hasEvent: true,
            startDate: null,
            endDate: null,
            error: EVENT_MISSING_TIME_ERROR,
        };
    }

    if (endDate.getTime() <= startDate.getTime()) {
        return {
            hasEvent: true,
            startDate: null,
            endDate: null,
            error: EVENT_END_BEFORE_START_ERROR,
        };
    }

    return {
        hasEvent: true,
        startDate,
        endDate,
    };
}
