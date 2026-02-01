'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPlatform, isNative, Platform } from '@/lib/platform';

interface PlatformContextType {
    platform: Platform;
    isNative: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isMobile: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
    const [value, setValue] = useState<PlatformContextType>({
        platform: 'web',
        isNative: false,
        isIOS: false,
        isAndroid: false,
        isMobile: false,
    });

    useEffect(() => {
        const platform = getPlatform();
        const native = isNative();

        setValue({
            platform,
            isNative: native,
            isIOS: platform === 'ios',
            isAndroid: platform === 'android',
            isMobile: platform === 'ios' || platform === 'android',
        });
    }, []);

    return (
        <PlatformContext.Provider value={value}>
            {children}
        </PlatformContext.Provider>
    );
}

export function usePlatformContext() {
    const context = useContext(PlatformContext);
    if (context === undefined) {
        throw new Error('usePlatformContext must be used within a PlatformProvider');
    }
    return context;
}
