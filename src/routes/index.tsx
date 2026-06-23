/** @format */

"use client";

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { CreateTimetableModal } from "@/components/timetables";
import { useTimetable } from "@/lib/timetable-context";
import { getLastTimetableId } from "@/lib/last-timetable";

export const Route = createFileRoute("/")({
    component: IndexPage,
});

function IndexPage() {
    const { timetables, isLoading } = useTimetable();

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (timetables.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                        No timetable selected. Create a new timetable to get
                        started.
                    </p>
                    <CreateTimetableModal />
                </div>
            </div>
        );
    }

    const lastId = getLastTimetableId();
    const target =
        timetables.find((timetable) => timetable.id === lastId) ??
        timetables[0];

    return (
        <Navigate
            to="/t/$timetableId"
            params={{ timetableId: target.id }}
            replace
        />
    );
}
