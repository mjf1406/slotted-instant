/** @format */

"use client";

import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { db } from "./db";
import type { Timetable } from "./types";
import type { TimetableContextState } from "./timetable-types";
import {
    clearLastTimetableId,
    getLastTimetableId,
    setLastTimetableId,
} from "./last-timetable";

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
    const navigate = useNavigate();
    const params = useParams({ strict: false });
    const routeTimetableId = params.timetableId;

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

    const rawTimetables = (data?.timetables || []) as Timetable[];

    const prevIdsRef = useRef<string>("");
    const timetablesRef = useRef<Timetable[]>([]);

    const currentIdsString = rawTimetables
        .map((timetable) => timetable.id)
        .sort()
        .join(",");

    if (currentIdsString !== prevIdsRef.current) {
        prevIdsRef.current = currentIdsString;
        timetablesRef.current = rawTimetables;
    }

    const timetables = timetablesRef.current;

    const selectedTimetable = useMemo(() => {
        if (timetables.length === 0) return null;

        const preferredId = routeTimetableId ?? getLastTimetableId();
        if (preferredId) {
            const match = timetables.find(
                (timetable) => timetable.id === preferredId
            );
            if (match) return match;
        }

        return timetables[0] ?? null;
    }, [routeTimetableId, timetables]);

    useEffect(() => {
        if (selectedTimetable?.id) {
            setLastTimetableId(selectedTimetable.id);
        }
    }, [selectedTimetable?.id]);

    const setSelectedTimetable = useCallback(
        (timetable: Timetable | null) => {
            if (timetable) {
                setLastTimetableId(timetable.id);
                void navigate({
                    to: "/t/$timetableId",
                    params: { timetableId: timetable.id },
                });
                return;
            }

            clearLastTimetableId();
            void navigate({ to: "/" });
        },
        [navigate]
    );

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
