/**
 * Platform utility for detect the current running environment.
 * This is designed to be used with a native wrapper like Capacitor.
 */

export type Platform = 'web' | 'ios' | 'android';

export function getPlatform(): Platform {
    if (typeof window === 'undefined') return 'web';

    const userAgent = window.navigator.userAgent.toLowerCase();

    // Detect iOS
    if (/iphone|ipad|ipod/.test(userAgent)) {
        return 'ios';
    }

    // Detect Android
    if (/android/.test(userAgent)) {
        return 'android';
    }

    return 'web';
}

export const isNative = (): boolean => {
    // Capacitor adds these to the window object
    // @ts-ignore
    return !!(window.Capacitor && window.Capacitor.isNative);
};

export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
export const isMobile = () => isIOS() || isAndroid();

/**
 * Utility to get safe area insets if needed programmatically.
 * Usually handled via CSS env() variables.
 */
export const getSafeAreaInsets = () => {
    // Logic to interface with native bridge if required
    return {
        top: 'env(safe-area-inset-top)',
        right: 'env(safe-area-inset-right)',
        bottom: 'env(safe-area-inset-bottom)',
        left: 'env(safe-area-inset-left)',
    };
};

/**
 * Utility to open external links.
 * On web, it uses window.open.
 * On native, it should use a browser plugin (e.g., Capacitor Browser).
 */
export const openExternalLink = (url: string) => {
    if (typeof window === 'undefined') return;

    // @ts-ignore
    if (window.Capacitor && window.Capacitor.isNative) {
        // This assumes Capacitor Browser plugin is installed
        // In a real app, you'd call: Browser.open({ url });
        // For now, we fall back to window.open which usually works in modern WebViews
        window.open(url, '_blank');
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};
