/**
 * Haptics utility for triggering physical feedback.
 * Works on Android (Chrome/PWA) via the Vibration API.
 * iOS Safari does not currently support navigator.vibrate.
 */
type VibrationPattern = number | number[];

function canVibrate(): boolean {
    if (typeof navigator === "undefined") return false;
    return typeof navigator.vibrate === "function";
}

function trigger(pattern: VibrationPattern): void {
    if (!canVibrate()) return;

    try {
        navigator.vibrate(pattern);
    } catch {
        // Ignore vibration failures on unsupported devices/webviews.
    }
}

export const haptics = {
    /**
     * Triggers a light vibration (impact).
     */
    light: () => {
        trigger(12);
    },

    /**
     * Triggers a medium vibration (notification/success).
     */
    medium: () => {
        trigger([18, 16, 18]);
    },

    /**
     * Triggers a heavy vibration (selection).
     */
    heavy: () => {
        trigger([28, 18, 28]);
    },

    /**
     * Triggers an error/warning pattern.
     */
    error: () => {
        trigger([35, 24, 35, 24, 35]);
    },
};

export function hapticsSupported(): boolean {
    return canVibrate();
}
