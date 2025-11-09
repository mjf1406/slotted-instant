/** @format */

"use client";

import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Calendar,
    CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    formatWeekRange,
    formatDayDate,
    getNextWeek,
    getPreviousWeek,
    getNextDay,
    getPreviousDay,
} from "./utils";

interface TimetableNavigationProps {
    viewMode: "week" | "day";
    currentWeekStart: Date;
    currentDate: Date;
    onWeekChange: (newWeekStart: Date) => void;
    onDateChange: (newDate: Date) => void;
    onGoToCurrent: () => void;
    onViewModeChange: (mode: "week" | "day") => void;
}

export function TimetableNavigation({
    viewMode,
    currentWeekStart,
    currentDate,
    onWeekChange,
    onDateChange,
    onGoToCurrent,
    onViewModeChange,
}: TimetableNavigationProps) {
    const handlePrevious = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (viewMode === "week") {
            onWeekChange(getPreviousWeek(currentWeekStart));
        } else {
            onDateChange(getPreviousDay(currentDate));
        }
    };

    const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (viewMode === "week") {
            onWeekChange(getNextWeek(currentWeekStart));
        } else {
            onDateChange(getNextDay(currentDate));
        }
    };

    const dateDisplay =
        viewMode === "week"
            ? formatWeekRange(currentWeekStart)
            : formatDayDate(currentDate);

    return (
        <div className="sticky top-16 z-40 grid grid-cols-3 items-center gap-4 mb-0 flex-wrap bg-background py-2 border-b rounded-lg group-has-data-[collapsible=icon]/sidebar-wrapper:top-12">
            <div></div>
            <div className="flex items-center justify-center gap-2 shrink-0 relative z-10">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePrevious}
                    aria-label={
                        viewMode === "week" ? "Previous week" : "Previous day"
                    }
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[200px] text-center font-medium">
                    {dateDisplay}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    aria-label={viewMode === "week" ? "Next week" : "Next day"}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center justify-end gap-2 shrink-0 relative z-0">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onGoToCurrent}
                    aria-label={`Go to Current ${
                        viewMode === "week" ? "Week" : "Day"
                    }`}
                    title={`Go to Current ${
                        viewMode === "week" ? "Week" : "Day"
                    }`}
                >
                    <CalendarClock className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                        onViewModeChange(viewMode === "week" ? "day" : "week")
                    }
                    aria-label={
                        viewMode === "week"
                            ? "Switch to Day View"
                            : "Switch to Week View"
                    }
                    title={
                        viewMode === "week"
                            ? "Switch to Day View"
                            : "Switch to Week View"
                    }
                >
                    {viewMode === "week" ? (
                        <CalendarDays className="h-4 w-4" />
                    ) : (
                        <Calendar className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
