"use client";

import { useState, useEffect } from "react";
import { saveSubscription } from "@/actions/push";
import { haptics } from "@/lib/haptics";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export function PushInitializer() {
    const hasVapidKey = VAPID_PUBLIC_KEY.length > 0;
    const supportsPush =
        hasVapidKey &&
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>(() => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return "default";
        }
        return Notification.permission;
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!supportsPush) return;

        let cancelled = false;

        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();
            if (cancelled) return;
            setIsSubscribed(!!sub);
            setPermission(Notification.permission);
        });

        return () => {
            cancelled = true;
        };
    }, [supportsPush]);

    const subscribe = async () => {
        try {
            haptics.light();
            const status = await Notification.requestPermission();
            setPermission(status);

            if (status !== "granted") return;
            if (!hasVapidKey) {
                setError("Push is not configured. Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const result = await saveSubscription(JSON.parse(JSON.stringify(sub)));
            if (result.success) {
                setIsSubscribed(true);
                haptics.medium();
            } else if (result.error) {
                setError(result.error);
            }
        } catch (err) {
            console.error("Subscription failed:", err);
            setError(err instanceof Error ? err.message : "Subscription failed.");
        }
    };

    if (!hasVapidKey) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider">Push Not Configured</h3>
                <p className="text-xs text-amber-100/80 font-mono mt-1">
                    Missing <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>. Add VAPID keys to enable mobile push.
                </p>
            </div>
        );
    }

    if (!supportsPush || isSubscribed || permission === "denied") return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enable Mobile Notifications</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">Get updates on your phone for task deadlines and voucher actions.</p>
                </div>
                <button
                    onClick={subscribe}
                    className="px-4 py-2 bg-slate-200 hover:bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                >
                    Enable
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-300 font-mono mt-3">{error}</p>
            )}
        </div>
    );
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
