export interface GoogleEventColorOption {
    aliasToken: string;
    nativeToken: string;
    colorId: GoogleEventColorId;
    swatchHex: string;
}

export interface ColorTokenOccurrence {
    start: number;
    end: number;
    token: string;
}

export interface EventColorMatch extends ColorTokenOccurrence {
    colorId: GoogleEventColorId;
    aliasToken: string;
    nativeToken: string;
}

export interface ResolvedEventColorSelection {
    colorId: GoogleEventColorId | null;
    aliasToken: string | null;
    nativeToken: string | null;
    matches: EventColorMatch[];
}

export interface EventColorUsageValidation {
    error?: string;
}

export type GoogleEventColorId = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11";

const GOOGLE_EVENT_COLOR_OPTIONS_INTERNAL: GoogleEventColorOption[] = [
    { aliasToken: "-lavender", nativeToken: "-lavender", colorId: "1", swatchHex: "#7986CB" },
    { aliasToken: "-lgreen", nativeToken: "-sage", colorId: "2", swatchHex: "#33B679" },
    { aliasToken: "-grape", nativeToken: "-grape", colorId: "3", swatchHex: "#8E24AA" },
    { aliasToken: "-pink", nativeToken: "-flamingo", colorId: "4", swatchHex: "#E67C73" },
    { aliasToken: "-yellow", nativeToken: "-banana", colorId: "5", swatchHex: "#F6BF26" },
    { aliasToken: "-orange", nativeToken: "-tangerine", colorId: "6", swatchHex: "#F4511E" },
    { aliasToken: "-lblue", nativeToken: "-peacock", colorId: "7", swatchHex: "#039BE5" },
    { aliasToken: "-graphite", nativeToken: "-graphite", colorId: "8", swatchHex: "#616161" },
    { aliasToken: "-blue", nativeToken: "-blueberry", colorId: "9", swatchHex: "#3F51B5" },
    { aliasToken: "-green", nativeToken: "-basil", colorId: "10", swatchHex: "#0B8043" },
    { aliasToken: "-red", nativeToken: "-tomato", colorId: "11", swatchHex: "#D50000" },
];

const ALIAS_VARIANTS: Record<string, string> = {
    "-lightgreen": "-lgreen",
    "-light-green": "-lgreen",
    "-lightblue": "-lblue",
    "-light-blue": "-lblue",
};

export const GOOGLE_EVENT_COLOR_OPTIONS = GOOGLE_EVENT_COLOR_OPTIONS_INTERNAL.map((option) => ({ ...option }));
export const GOOGLE_EVENT_COLOR_ALIAS_OPTIONS = GOOGLE_EVENT_COLOR_OPTIONS.map((option) => option.aliasToken);

const COLOR_ID_SET = new Set<GoogleEventColorId>(GOOGLE_EVENT_COLOR_OPTIONS.map((option) => option.colorId));
const COLOR_HELPER_TOKEN_REGEX = /(^|\s)(-color)(?=\s|$)/gi;
const COLOR_VALUE_LOOKUP = new Map<string, GoogleEventColorOption>();

for (const option of GOOGLE_EVENT_COLOR_OPTIONS) {
    COLOR_VALUE_LOOKUP.set(option.aliasToken, option);
    COLOR_VALUE_LOOKUP.set(option.nativeToken, option);
}

for (const [variantToken, aliasToken] of Object.entries(ALIAS_VARIANTS)) {
    const mapped = COLOR_VALUE_LOOKUP.get(aliasToken);
    if (mapped) {
        COLOR_VALUE_LOOKUP.set(variantToken, mapped);
    }
}

const COLOR_VALUE_TOKEN_NAMES = Array.from(COLOR_VALUE_LOOKUP.keys())
    .map((token) => token.slice(1))
    .sort((a, b) => b.length - a.length)
    .map((tokenName) => tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

const COLOR_VALUE_TOKEN_REGEX = new RegExp(
    `(^|\\s)(-(?:${COLOR_VALUE_TOKEN_NAMES.join("|")}))(?=\\s|$)`,
    "gi"
);

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function normalizeToken(token: string): string {
    return token.trim().toLowerCase();
}

function buildOccurrence(match: RegExpExecArray): ColorTokenOccurrence {
    const leading = match[1] || "";
    const token = match[2] || "";
    const start = (match.index ?? 0) + leading.length;
    return {
        start,
        end: start + token.length,
        token,
    };
}

export function isGoogleEventColorId(value: unknown): value is GoogleEventColorId {
    return typeof value === "string" && COLOR_ID_SET.has(value as GoogleEventColorId);
}

export function getGoogleEventColorOptionByAlias(aliasToken: string): GoogleEventColorOption | null {
    const normalized = normalizeToken(aliasToken);
    const option = GOOGLE_EVENT_COLOR_OPTIONS.find((entry) => entry.aliasToken === normalized);
    return option ? { ...option } : null;
}

export function extractColorHelperTokens(rawTitle: string): ColorTokenOccurrence[] {
    const matches = Array.from(rawTitle.matchAll(new RegExp(COLOR_HELPER_TOKEN_REGEX.source, "gi")));
    return matches.map(buildOccurrence);
}

export function extractEventColorMatches(rawTitle: string): EventColorMatch[] {
    const matches = Array.from(rawTitle.matchAll(new RegExp(COLOR_VALUE_TOKEN_REGEX.source, "gi")));
    const parsed: EventColorMatch[] = [];
    for (const match of matches) {
        const occurrence = buildOccurrence(match);
        const normalized = normalizeToken(occurrence.token);
        const option = COLOR_VALUE_LOOKUP.get(normalized);
        if (!option) continue;
        parsed.push({
            ...occurrence,
            colorId: option.colorId,
            aliasToken: option.aliasToken,
            nativeToken: option.nativeToken,
        });
    }
    return parsed;
}

export function resolveEventColorFromTitle(rawTitle: string): ResolvedEventColorSelection {
    const matches = extractEventColorMatches(rawTitle);
    const latest = matches[matches.length - 1];
    return {
        colorId: latest?.colorId ?? null,
        aliasToken: latest?.aliasToken ?? null,
        nativeToken: latest?.nativeToken ?? null,
        matches,
    };
}

export function findNearestColorHelperToken(rawTitle: string, caretIndex: number): ColorTokenOccurrence | null {
    const helpers = extractColorHelperTokens(rawTitle);
    if (helpers.length === 0) return null;

    let selected: ColorTokenOccurrence | null = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (const helper of helpers) {
        const distance =
            caretIndex >= helper.start && caretIndex <= helper.end
                ? 0
                : Math.min(Math.abs(caretIndex - helper.start), Math.abs(caretIndex - helper.end));

        if (distance < smallestDistance || (distance === smallestDistance && helper.start > (selected?.start ?? -1))) {
            smallestDistance = distance;
            selected = helper;
        }
    }

    return selected;
}

export function replaceNearestColorHelperToken(
    rawTitle: string,
    caretIndex: number,
    replacementAliasToken: string
): { nextTitle: string; nextCaretIndex: number; replaced: boolean } {
    const normalizedAliasToken = normalizeToken(replacementAliasToken);
    const option = getGoogleEventColorOptionByAlias(normalizedAliasToken);
    if (!option) {
        return {
            nextTitle: rawTitle,
            nextCaretIndex: caretIndex,
            replaced: false,
        };
    }

    const target = findNearestColorHelperToken(rawTitle, caretIndex);
    if (!target) {
        return {
            nextTitle: rawTitle,
            nextCaretIndex: caretIndex,
            replaced: false,
        };
    }

    const nextTitle = `${rawTitle.slice(0, target.start)}${option.aliasToken}${rawTitle.slice(target.end)}`;
    const nextCaretIndex = target.start + option.aliasToken.length;
    return {
        nextTitle,
        nextCaretIndex,
        replaced: true,
    };
}

export function stripEventColorTokens(rawTitle: string): string {
    const withoutHelpers = rawTitle.replace(new RegExp(COLOR_HELPER_TOKEN_REGEX.source, "gi"), "$1");
    const withoutColors = withoutHelpers.replace(new RegExp(COLOR_VALUE_TOKEN_REGEX.source, "gi"), "$1");
    return normalizeWhitespace(withoutColors);
}

export function validateEventColorUsage(rawTitle: string, hasEvent: boolean): EventColorUsageValidation {
    const helperCount = extractColorHelperTokens(rawTitle).length;
    const matchCount = extractEventColorMatches(rawTitle).length;

    if (!hasEvent && (helperCount > 0 || matchCount > 0)) {
        return {
            error: "Color tags are supported only for -event tasks. Use -event with -pink, -blue, etc.",
        };
    }

    if (hasEvent && helperCount > 0) {
        return {
            error: "Choose a color token for -color (for example: -pink).",
        };
    }

    return {};
}
