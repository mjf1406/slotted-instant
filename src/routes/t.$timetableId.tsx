/** @format */

"use client";

import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import {
    CreateTimetableModal,
    WeekView,
    DayView,
    TimetableNavigation,
} from "@/components/timetables";
import {
    getWeekStart,
} from "@/components/timetables/utils";
import { useSettings } from "@/lib/settings-context";
import { useTimetable } from "@/lib/timetable-context";
import {
    parseTimetableSearch,
    toDateSearchParam,
    validateTimetableSearch,
    type TimetableViewMode,
} from "@/lib/timetable-view";

export const Route = createFileRoute("/t/$timetableId")({
    validateSearch: validateTimetableSearch,
    component: TimetablePage,
});

function TimetablePage() {
    const { timetableId } = Route.useParams();
    const search = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const { settings } = useSettings();
    const { selectedTimetable, timetables, isLoading } = useTimetable();
    const zoomLevel = settings.zoomLevel ?? 1.0;

    const { viewMode, currentWeekStart, currentDate } = parseTimetableSearch(
        search,
        settings.weekStartDay
    );

    const updateSearch = useCallback(
        (updates: { view?: TimetableViewMode; date?: Date }) => {
            void navigate({
                search: (prev) => ({
                    view: updates.view ?? prev.view ?? "week",
                    date:
                        updates.date !== undefined
                            ? toDateSearchParam(updates.date)
                            : prev.date,
                }),
            });
        },
        [navigate]
    );

    const handleWeekChange = useCallback(
        (newWeekStart: Date) => {
            updateSearch({
                date:
                    viewMode === "week"
                        ? newWeekStart
                        : currentDate,
            });
        },
        [currentDate, updateSearch, viewMode]
    );

    const handleDateChange = useCallback(
        (newDate: Date) => {
            updateSearch({ date: newDate });
        },
        [updateSearch]
    );

    const handleGoToCurrent = useCallback(() => {
        const now = new Date();
        updateSearch({
            date:
                viewMode === "week"
                    ? getWeekStart(now, settings.weekStartDay)
                    : now,
        });
    }, [settings.weekStartDay, updateSearch, viewMode]);

    const handleViewModeChange = useCallback(
        (mode: TimetableViewMode) => {
            if (mode === "day") {
                updateSearch({ view: mode, date: new Date() });
                return;
            }

            updateSearch({
                view: mode,
                date: getWeekStart(currentDate, settings.weekStartDay),
            });
        },
        [currentDate, settings.weekStartDay, updateSearch]
    );

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const timetable =
        selectedTimetable ??
        timetables.find((item) => item.id === timetableId) ??
        null;

    if (!timetable) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                        Timetable not found. Choose another timetable or create
                        a new one.
                    </p>
                    <CreateTimetableModal />
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-1 flex-col gap-0 px-4 pb-4"
            style={{
                zoom: zoomLevel,
                transformOrigin: "top left",
            }}
        >
            <TimetableNavigation
                viewMode={viewMode}
                currentWeekStart={currentWeekStart}
                currentDate={currentDate}
                onWeekChange={handleWeekChange}
                onDateChange={handleDateChange}
                onGoToCurrent={handleGoToCurrent}
                onViewModeChange={handleViewModeChange}
            />
            <div className="overflow-hidden rounded-lg">
                {viewMode === "week" ? (
                    <WeekView
                        timetableId={timetable.id}
                        currentWeekStart={currentWeekStart}
                    />
                ) : (
                    <DayView
                        timetableId={timetable.id}
                        currentDate={currentDate}
                    />
                )}
            </div>
        </div>
    );
}
