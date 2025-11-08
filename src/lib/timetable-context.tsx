/** @format */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

    // Set first timetable as selected when timetables load
    useEffect(() => {
        if (
            !isLoading &&
            timetables.length > 0 &&
            !selectedTimetable &&
            !error &&
            user?.id
        ) {
            setSelectedTimetable(timetables[0]);
        }
    }, [isLoading, timetables, selectedTimetable, error, user?.id]);

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

