export interface ClientNotificationPayload {
    title: string;
    body: string;
    tag?: string;
    data?: Record<string, unknown>;
}

export interface ClientNotificationResult {
    success: boolean;
    message: string;
    permission?: NotificationPermission;
}

export function notificationsSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "Notification" in window;
}

export async function ensureNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!notificationsSupported()) return "unsupported";

    if (Notification.permission === "granted" || Notification.permission === "denied") {
        return Notification.permission;
    }

    return Notification.requestPermission();
}

export async function showLocalNotification(
    payload: ClientNotificationPayload
): Promise<ClientNotificationResult> {
    const permission = await ensureNotificationPermission();

    if (permission === "unsupported") {
        return {
            success: false,
            message: "Notifications are not supported in this browser.",
        };
    }

    if (permission !== "granted") {
        return {
            success: false,
            message: "Notification permission was not granted.",
            permission,
        };
    }

    try {
        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration?.showNotification) {
                await registration.showNotification(payload.title, {
                    body: payload.body,
                    tag: payload.tag,
                    data: payload.data,
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                });

                return {
                    success: true,
                    message: "Notification sent.",
                    permission,
                };
            }
        }

        new Notification(payload.title, {
            body: payload.body,
            tag: payload.tag,
            data: payload.data,
            icon: "/icon-192.png",
        });

        return {
            success: true,
            message: "Notification sent.",
            permission,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to show notification.",
            permission,
        };
    }
}

export async function showSampleNotification(): Promise<ClientNotificationResult> {
    return showLocalNotification({
        title: "TAS",
        body: "Notifications work",
        tag: "tas-notification-sample",
        data: { url: "/dashboard" },
    });
}
