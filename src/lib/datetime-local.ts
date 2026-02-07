export function toDateTimeLocalValue(date: Date | null | undefined): string {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getDatePartFromLocalDateTime(value: string): string {
    const [datePart] = value.split("T");
    return datePart || "";
}

export function getTimePartFromLocalDateTime(value: string): string {
    const [, timePart] = value.split("T");
    if (!timePart) return "";
    return timePart.slice(0, 5);
}

export function combineDateAndTime(datePart: string, timePart: string): string {
    if (!datePart || !timePart) return "";
    return `${datePart}T${timePart}`;
}

export function fromDateTimeLocalValue(value: string): Date | null {
    if (!value) return null;

    const [datePart, timePart] = value.split("T");
    if (!datePart || !timePart) return null;

    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
    ) {
        return null;
    }

    const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

export function localDateTimeToIso(value: string): string | null {
    const parsed = fromDateTimeLocalValue(value);
    if (!parsed) return null;
    return parsed.toISOString();
}
