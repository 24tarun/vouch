export const SUPPORTED_CURRENCIES = ["EUR", "USD", "INR"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "EUR";

const SUPPORTED_CURRENCY_SET = new Set<string>(SUPPORTED_CURRENCIES);

export interface FailureCostBounds {
    minMajor: number;
    maxMajor: number;
    minCents: number;
    maxCents: number;
    step: number;
}

interface FormatCurrencyFromCentsOptions {
    locale?: string;
    absolute?: boolean;
}

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
    return typeof value === "string" && SUPPORTED_CURRENCY_SET.has(value);
}

export function normalizeCurrency(
    value: unknown,
    fallback: SupportedCurrency = DEFAULT_CURRENCY
): SupportedCurrency {
    return isSupportedCurrency(value) ? value : fallback;
}

export function getFailureCostBounds(currency: SupportedCurrency): FailureCostBounds {
    switch (currency) {
        case "INR":
            return {
                minMajor: 50,
                maxMajor: 1000,
                minCents: 5000,
                maxCents: 100000,
                step: 1,
            };
        case "USD":
        case "EUR":
        default:
            return {
                minMajor: 1,
                maxMajor: 100,
                minCents: 100,
                maxCents: 10000,
                step: 0.01,
            };
    }
}

export function getCurrencyFormatter(
    currency: SupportedCurrency,
    locale: string = "en-GB"
): Intl.NumberFormat {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function getCurrencySymbol(
    currency: SupportedCurrency,
    locale: string = "en-GB"
): string {
    const parts = getCurrencyFormatter(currency, locale).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value || currency;
}

export function formatCurrencyFromCents(
    amountCents: number,
    currency: SupportedCurrency,
    options?: FormatCurrencyFromCentsOptions
): string {
    const normalized = Number.isFinite(amountCents) ? amountCents : 0;
    const displayAmount = (options?.absolute ? Math.abs(normalized) : normalized) / 100;
    return getCurrencyFormatter(currency, options?.locale).format(displayAmount);
}
