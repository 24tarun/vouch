/**
 * Haptics utility for triggering physical feedback.
 * Works on Android (Chrome/PWA) via the Vibration API.
 * iOS Safari does not currently support navigator.vibrate.
 */
export const haptics = {
    /**
     * Triggers a light vibration (impact).
     */
    light: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    /**
     * Triggers a medium vibration (notification/success).
     */
    medium: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20);
        }
    },

    /**
     * Triggers a heavy vibration (selection).
     */
    heavy: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    /**
     * Triggers an error/warning pattern.
     */
    error: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    },
};
