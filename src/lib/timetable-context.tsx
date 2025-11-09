/** @format */

"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { db } from "./db";
import type { Timetable } from "./types";

type TimetableContextState = {
    selectedTimetable: Timetable | null;
    setSelectedTimetable: (timetable: Timetable | null) => void;
    timetables: Timetable[];
    isLoading: boolean;
    error: Error | null;
};

const initialState: TimetableContextState = {
    selectedTimetable: null,
    setSelectedTimetable: () => null,
    timetables: [],
    isLoading: false,
    error: null,
};

const TimetableContext = createContext<TimetableContextState>(initialState);

function TimetableProviderContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = db.useUser();
    const [selectedTimetable, setSelectedTimetable] =
        useState<Timetable | null>(null);
    // Use ref to track selected timetable ID to prevent infinite loops
    const selectedTimetableIdRef = useRef<string | null>(null);

    const { data, isLoading, error } = db.useQuery(
        user?.id
            ? {
                  timetables: {
                      $: {
                          where: { "owner.id": user.id },
                      },
                      owner: {},
                      classes: {},
                      slots: {},
                      slotClasses: {},
                  },
              }
            : {}
    );

    const timetables = (data?.timetables || []) as Timetable[];

    // Sync selected timetable with query params
    // This effect should only run when query params change or timetables load
    useEffect(() => {
        if (typeof window === "undefined" || isLoading || !user?.id) return;

        const params = new URLSearchParams(window.location.search);
        const timetableId = params.get("timetableId");

        if (timetableId && timetables.length > 0) {
            const timetable = timetables.find((t) => t.id === timetableId);
            // Only update if the timetable exists and is different from current selection
            if (timetable && timetable.id !== selectedTimetableIdRef.current) {
                selectedTimetableIdRef.current = timetable.id;
                setSelectedTimetable(timetable);
            }
        } else if (
            !timetableId &&
            timetables.length > 0 &&
            !selectedTimetableIdRef.current &&
            !error
        ) {
            // Set first timetable as selected when timetables load (if no query param)
            const firstTimetable = timetables[0];
            selectedTimetableIdRef.current = firstTimetable.id;
            setSelectedTimetable(firstTimetable);
        }
    }, [isLoading, timetables, error, user?.id]);

    // Update query params when selected timetable changes
    useEffect(() => {
        if (typeof window === "undefined" || !selectedTimetable) {
            selectedTimetableIdRef.current = null;
            return;
        }

        // Update ref to match current selection
        selectedTimetableIdRef.current = selectedTimetable.id;

        const params = new URLSearchParams(window.location.search);
        const currentTimetableId = params.get("timetableId");

        if (selectedTimetable.id !== currentTimetableId) {
            params.set("timetableId", selectedTimetable.id);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", newUrl);
        }
    }, [selectedTimetable]);

    return (
        <TimetableContext.Provider
            value={{
                selectedTimetable,
                setSelectedTimetable,
                timetables,
                isLoading,
                error: error as Error | null,
            }}
        >
            {children}
        </TimetableContext.Provider>
    );
}

export function TimetableProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <db.SignedIn>
                <TimetableProviderContent>{children}</TimetableProviderContent>
            </db.SignedIn>
            <db.SignedOut>
                <TimetableContext.Provider value={initialState}>
                    {children}
                </TimetableContext.Provider>
            </db.SignedOut>
        </>
    );
}

export function useTimetable() {
    const context = useContext(TimetableContext);

    if (context === undefined) {
        throw new Error("useTimetable must be used within a TimetableProvider");
    }

    return context;
}

