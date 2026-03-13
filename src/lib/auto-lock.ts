"use client";

import { Capacitor } from "@capacitor/core";
import { KeepAwake } from "@capacitor-community/keep-awake";
import type { PomoSession } from "@/lib/types";

type SessionStatus = PomoSession["status"] | null | undefined;

export interface AutoLockAdapter {
    suppressAutoLock: () => Promise<void>;
    allowAutoLock: () => Promise<void>;
}

function isNativeMobilePlatform(): boolean {
    if (!Capacitor.isNativePlatform()) return false;
    const platform = Capacitor.getPlatform();
    return platform === "ios" || platform === "android";
}

const capacitorAutoLockAdapter: AutoLockAdapter = {
    suppressAutoLock: async () => {
        if (!isNativeMobilePlatform()) return;
        await KeepAwake.keepAwake();
    },
    allowAutoLock: async () => {
        if (!isNativeMobilePlatform()) return;
        await KeepAwake.allowSleep();
    },
};

export function shouldSuppressAutoLock(status: SessionStatus, minimized: boolean): boolean {
    return status === "ACTIVE" && !minimized;
}

export function createAutoLockController(adapter: AutoLockAdapter = capacitorAutoLockAdapter) {
    let lastRequestedState: boolean | null = null;

    const setAutoLockSuppressed = async (enabled: boolean) => {
        if (lastRequestedState === enabled) return;
        lastRequestedState = enabled;

        try {
            if (enabled) {
                await adapter.suppressAutoLock();
            } else {
                await adapter.allowAutoLock();
            }
        } catch (error) {
            lastRequestedState = null;
            console.error("Failed to update native auto-lock state:", error);
        }
    };

    const cleanup = async () => {
        lastRequestedState = null;
        try {
            await adapter.allowAutoLock();
        } catch (error) {
            console.error("Failed to release native auto-lock suppression on cleanup:", error);
        }
    };

    return {
        setAutoLockSuppressed,
        cleanup,
    };
}
