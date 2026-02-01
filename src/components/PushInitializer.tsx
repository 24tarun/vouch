"use client";

import { useState, useEffect } from "react";
import { saveSubscription } from "@/actions/push";
import { haptics } from "@/lib/haptics";

// Public VAPID Key (Replace with your actual public key)
const VAPID_PUBLIC_KEY = "BExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export function PushInitializer() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Check if already subscribed
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    const subscribe = async () => {
        try {
            haptics.light();
            const status = await Notification.requestPermission();
            setPermission(status);

            if (status !== "granted") return;

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const result = await saveSubscription(JSON.parse(JSON.stringify(sub)));
            if (result.success) {
                setIsSubscribed(true);
                haptics.medium();
            }
        } catch (err) {
            console.error("Subscription failed:", err);
        }
    };

    if (!isSupported || isSubscribed || permission === "denied") return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enable Mobile Notifications</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Get updates on your phone for task deadlines.</p>
            </div>
            <button
                onClick={subscribe}
                className="px-4 py-2 bg-slate-200 hover:bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
            >
                Enable
            </button>
        </div>
    );
}

// Helper to convert VAPID public key
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
