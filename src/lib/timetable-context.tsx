/** @format */

"use client";

import React, { createContext, useState, useEffect, useRef } from "react";
import { db } from "./db";
import type { Timetable } from "./types";
import type { TimetableContextState } from "./timetable-types";

const initialState: TimetableContextState = {
    selectedTimetable: null,
    setSelectedTimetable: () => null,
    timetables: [],
    isLoading: false,
    error: null,
};

export const TimetableContext =
    createContext<TimetableContextState>(initialState);

function TimetableProviderContent({ children }: { children: React.ReactNode }) {
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

    // Get raw timetables from query
    const rawTimetables = (data?.timetables || []) as Timetable[];

    // Track previous IDs to detect actual changes
    const prevIdsRef = useRef<string>("");
    const timetablesRef = useRef<Timetable[]>([]);

    // Create a stable string of timetable IDs for comparison
    const currentIdsString = rawTimetables
        .map((t) => t.id)
        .sort()
        .join(",");

    // Only update timetables if IDs actually changed
    if (currentIdsString !== prevIdsRef.current) {
        prevIdsRef.current = currentIdsString;
        timetablesRef.current = rawTimetables;
    }

    const timetables = timetablesRef.current;
    const timetablesIdsString = currentIdsString;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, timetablesIdsString, error, user?.id]); // timetables accessed via closure is stable

    // Update query params when selected timetable changes
    // Use ID comparison to prevent infinite loops from object reference changes
    useEffect(() => {
        if (typeof window === "undefined" || !selectedTimetable) {
            if (selectedTimetableIdRef.current !== null) {
                selectedTimetableIdRef.current = null;
            }
            return;
        }

        // Only update if the ID actually changed (not just the object reference)
        if (selectedTimetable.id === selectedTimetableIdRef.current) {
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
    }, [selectedTimetable?.id]); // Only depend on the ID, not the whole object

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

export function TimetableProvider({ children }: { children: React.ReactNode }) {
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

export { useTimetable } from "./use-timetable";
