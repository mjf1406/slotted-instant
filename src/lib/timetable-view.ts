/** @format */

import { useMemo } from "react";
import { useParams, useSearch } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings-context";
import {
    getCurrentWeekStart,
    getWeekStart,
} from "@/components/timetables/utils";

export type TimetableViewMode = "week" | "day";

export type TimetableSearch = {
    view?: TimetableViewMode;
    date?: string;
};

export function parseTimetableSearch(
    search: Record<string, unknown>,
    weekStartDay: "sunday" | "monday"
): {
    viewMode: TimetableViewMode;
    currentDate: Date;
    currentWeekStart: Date;
} {
    const viewMode: TimetableViewMode =
        search.view === "day" ? "day" : "week";

    const currentDate =
        typeof search.date === "string" && search.date.length > 0
            ? parseDateParam(search.date, weekStartDay)
            : getCurrentWeekStart(weekStartDay);

    const currentWeekStart = getWeekStart(currentDate, weekStartDay);

    return { viewMode, currentDate, currentWeekStart };
}

function parseDateParam(
    date: string,
    weekStartDay: "sunday" | "monday"
): Date {
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return getCurrentWeekStart(weekStartDay);
    }
    return parsed;
}

export function toDateSearchParam(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function validateTimetableSearch(
    search: Record<string, unknown>
): TimetableSearch {
    return {
        view: search.view === "day" ? "day" : "week",
        date:
            typeof search.date === "string" && search.date.length > 0
                ? search.date
                : undefined,
    };
}

/** Read timetable week/day state from the route when available, else sensible defaults. */
export function useTimetableViewState() {
    const { settings } = useSettings();
    const params = useParams({ strict: false });
    const search = useSearch({ strict: false }) as TimetableSearch;

    return useMemo(() => {
        if (params.timetableId) {
            return parseTimetableSearch(
                {
                    view: search.view,
                    date: search.date,
                },
                settings.weekStartDay
            );
        }

        const currentWeekStart = getCurrentWeekStart(settings.weekStartDay);
        return {
            viewMode: "week" as const,
            currentWeekStart,
            currentDate: new Date(),
        };
    }, [
        params.timetableId,
        search.view,
        search.date,
        settings.weekStartDay,
    ]);
}
