/** @format */

"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { db } from "./db";
import { id } from "@instantdb/react";

type WeekStartDay = "sunday" | "monday";
type TimeFormat = "12" | "24";

type UserSettings = {
    weekStartDay: WeekStartDay;
    timeFormat: TimeFormat;
};

type SettingsContextState = {
    settings: UserSettings;
    isLoading: boolean;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
};

const defaultSettings: UserSettings = {
    weekStartDay: "monday",
    timeFormat: "24",
};

const SettingsContext = createContext<SettingsContextState>({
    settings: defaultSettings,
    isLoading: false,
    updateSettings: async () => {},
});

function SettingsProviderContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = db.useUser();

    const { data, isLoading } = db.useQuery(
        user?.id
            ? {
                  userSettings: {
                      $: {
                          where: { "owner.id": user.id },
                      },
                      owner: {},
                  },
              }
            : {}
    );

    const settingsData = data?.userSettings?.[0];

    const settings: UserSettings = useMemo(() => {
        if (!settingsData) {
            return defaultSettings;
        }
        return {
            weekStartDay: (settingsData.weekStartDay as WeekStartDay) || "monday",
            timeFormat: (settingsData.timeFormat as TimeFormat) || "24",
        };
    }, [settingsData]);

    // Create default settings if they don't exist
    useEffect(() => {
        if (!isLoading && !settingsData && user?.id) {
            db.transact(
                db.tx.userSettings[id()].update({
                    weekStartDay: defaultSettings.weekStartDay,
                    timeFormat: defaultSettings.timeFormat,
                }).link({ owner: user.id })
            );
        }
    }, [isLoading, settingsData, user?.id]);

    const updateSettings = async (updates: Partial<UserSettings>) => {
        if (!user?.id) return;

        const newSettings = { ...settings, ...updates };
        
        if (settingsData) {
            // Update existing settings
            await db.transact(
                db.tx.userSettings[settingsData.id].update({
                    weekStartDay: newSettings.weekStartDay,
                    timeFormat: newSettings.timeFormat,
                })
            );
        } else {
            // Create new settings
            await db.transact(
                db.tx.userSettings[id()].update({
                    weekStartDay: newSettings.weekStartDay,
                    timeFormat: newSettings.timeFormat,
                }).link({ owner: user.id })
            );
        }
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                isLoading,
                updateSettings,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function SettingsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <db.SignedIn>
                <SettingsProviderContent>{children}</SettingsProviderContent>
            </db.SignedIn>
            <db.SignedOut>
                <SettingsContext.Provider
                    value={{
                        settings: defaultSettings,
                        isLoading: false,
                        updateSettings: async () => {},
                    }}
                >
                    {children}
                </SettingsContext.Provider>
            </db.SignedOut>
        </>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);

    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }

    return context;
}

export type { WeekStartDay, TimeFormat, UserSettings };

