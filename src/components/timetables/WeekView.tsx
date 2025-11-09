/** @format */

"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import type { Timetable, SlotEntity, SlotClass } from "@/lib/types";
import {
    timeToMinutes,
    minutesToTime,
    formatTimeString,
    getYearAndWeekNumber,
    getWeekStart,
    getWeekdays,
} from "./utils";
import { useSettings } from "@/lib/settings-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil } from "lucide-react";
import { CreateTimeSlotDialogContent } from "@/components/timeslots/CreateTimeSlotDialogContent";

interface WeekViewProps {
    timetableId: string;
    currentWeekStart?: Date;
}

export function WeekView({
    timetableId,
    currentWeekStart = getWeekStart(new Date()),
}: WeekViewProps) {
    const { settings } = useSettings();
    const [editingSlot, setEditingSlot] = useState<SlotEntity | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Use db.useQuery for real-time updates
    const { data, isLoading, error } = db.useQuery(
        timetableId
            ? {
                  timetables: {
                      $: {
                          where: { id: { $in: [timetableId] } },
                      },
                      owner: {},
                      classes: {},
                      slots: {
                          timetable: {},
                          disabledSlots: {},
                      },
                      slotClasses: {
                          slot: {},
                          class: {},
                      },
                  },
              }
            : {}
    );

    const timetable = data?.timetables?.[0] as Timetable | undefined;

    // Extract data with safe defaults
    const days = useMemo(
        () => (timetable?.days as string[]) || [],
        [timetable?.days]
    );
    const slots = useMemo(
        () => (timetable?.slots || []) as SlotEntity[],
        [timetable?.slots]
    );
    const allSlotClasses = useMemo(
        () => (timetable?.slotClasses || []) as SlotClass[],
        [timetable?.slotClasses]
    );

    // Filter slotClasses by current week
    const { year, weekNumber } = getYearAndWeekNumber(currentWeekStart);
    const slotClasses = useMemo(() => {
        return allSlotClasses.filter(
            (sc) => sc.year === year && sc.weekNumber === weekNumber
        );
    }, [allSlotClasses, year, weekNumber]);

    // Get start and end times from timetable (stored as minutes)
    const startTimeMinutes = timetable?.startTime ?? 0;
    const endTimeMinutes = timetable?.endTime ?? 0;

    // Generate time intervals (every 30 minutes) - must be called before early returns
    const timeIntervals = useMemo(() => {
        if (!timetable || startTimeMinutes >= endTimeMinutes) {
            return [];
        }
        const intervals: Array<{ time: string; minutes: number }> = [];
        let currentMinutes = startTimeMinutes;
        while (currentMinutes < endTimeMinutes) {
            intervals.push({
                time: minutesToTime(
                    currentMinutes,
                    settings.timeFormat as "12" | "24"
                ),
                minutes: currentMinutes,
            });
            currentMinutes += 30; // 30-minute intervals
        }
        return intervals;
    }, [timetable, startTimeMinutes, endTimeMinutes, settings.timeFormat]);

    // Group slots by day - must be called before early returns
    const slotsByDay = useMemo(() => {
        const grouped: Record<string, SlotEntity[]> = {};
        days.forEach((day) => {
            grouped[day] = slots.filter((slot) => slot.day === day);
        });
        return grouped;
    }, [slots, days]);

    // Early returns after all hooks
    if (!timetableId) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                    No timetable selected
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                    Loading timetable...
                </div>
            </div>
        );
    }

    if (error || !timetable) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-destructive">
                    {error?.message || "Timetable not found"}
                </div>
            </div>
        );
    }

    // Calculate total duration in minutes
    const totalDuration = endTimeMinutes - startTimeMinutes;

    // Helper function to calculate position and height for a slot
    const getSlotStyle = (slot: SlotEntity) => {
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        const slotDuration = endMinutes - startMinutes;

        // Calculate position from top (as percentage)
        const topPercent =
            ((startMinutes - startTimeMinutes) / totalDuration) * 100;
        // Calculate height (as percentage)
        const heightPercent = (slotDuration / totalDuration) * 100;

        return {
            top: `${topPercent}%`,
            height: `${heightPercent}%`,
        };
    };

    // Get slot classes for a specific slot
    const getSlotClassesForSlot = (slotId: string) => {
        return slotClasses.filter((sc) => sc.slot?.id === slotId && !sc.hidden);
    };

    // Check if a slot is disabled (always or for current week)
    const isSlotDisabled = (slot: SlotEntity): boolean => {
        // Check if always disabled
        if (slot.disabled === true) {
            return true;
        }

        // Check if disabled for current week
        if (!slot.disabledSlots || slot.disabledSlots.length === 0) {
            return false;
        }

        const nextWeekMonday = new Date(currentWeekStart);
        nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

        return slot.disabledSlots.some((disabledSlot) => {
            const disableDate = new Date(disabledSlot.disableDate);
            return (
                disableDate >= currentWeekStart && disableDate < nextWeekMonday
            );
        });
    };

    const handleEditSlot = (slot: SlotEntity) => {
        setEditingSlot(slot);
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setEditingSlot(null);
    };

    // Calculate the height for the time grid (each 30-minute interval = 60px)
    const gridHeight = (totalDuration / 30) * 60;

    // Helper function to get the date for a given day name
    const getDateForDay = (dayName: string): Date => {
        const weekdays = getWeekdays(settings.weekStartDay);
        const dayIndex = weekdays.indexOf(dayName as (typeof weekdays)[number]);
        if (dayIndex === -1) return currentWeekStart;

        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + dayIndex);
        return date;
    };

    return (
        <div className="w-full overflow-x-auto -mx-1">
            <div className="min-w-full">
                {/* Header row with day names */}
                <div
                    className="grid border-b bg-muted/50"
                    style={{
                        gridTemplateColumns: `${
                            settings.timeFormat === "12" ? "96px" : "80px"
                        } repeat(${days.length}, 1fr)`,
                    }}
                >
                    <div className="border-r p-2 text-sm font-medium">Time</div>
                    {days.map((day) => {
                        const dayDate = getDateForDay(day);
                        const dayNumber = dayDate.getDate();
                        return (
                            <div
                                key={day}
                                className="border-r p-2 text-center text-sm font-medium last:border-r-0"
                            >
                                <div>{day}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {dayNumber}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Time slots grid */}
                <div
                    className="relative"
                    style={{ height: `${gridHeight}px` }}
                >
                    {/* Time labels column - positioned absolutely */}
                    <div
                        className={`absolute left-0 top-0 bottom-0 border-r bg-muted/30 ${
                            settings.timeFormat === "12" ? "w-24" : "w-20"
                        }`}
                        style={{ zIndex: 1 }}
                    >
                        {timeIntervals.map((interval) => {
                            const topPercent =
                                ((interval.minutes - startTimeMinutes) /
                                    totalDuration) *
                                100;
                            return (
                                <div
                                    key={interval.minutes}
                                    className="absolute left-0 right-0 p-1 text-xs text-muted-foreground border-b whitespace-nowrap text-right pr-2"
                                    style={{ top: `${topPercent}%` }}
                                >
                                    {interval.time}
                                </div>
                            );
                        })}
                    </div>

                    {/* Day columns with slots */}
                    <div
                        className={`absolute right-0 top-0 bottom-0 grid ${
                            settings.timeFormat === "12" ? "left-24" : "left-20"
                        }`}
                        style={{
                            gridTemplateColumns: `repeat(${days.length}, 1fr)`,
                        }}
                    >
                        {days.map((day) => (
                            <div
                                key={day}
                                className="relative border-r last:border-r-0"
                            >
                                {/* Render slots for this day */}
                                {slotsByDay[day]?.map((slot) => {
                                    const style = getSlotStyle(slot);
                                    const classesInSlot = getSlotClassesForSlot(
                                        slot.id
                                    );
                                    const isDisabled = isSlotDisabled(slot);

                                    return (
                                        <DropdownMenu key={slot.id}>
                                            <DropdownMenuTrigger asChild>
                                                <div
                                                    className={`absolute left-1 right-1 border rounded p-1.5 shadow-sm transition-colors group ${
                                                        isDisabled
                                                            ? "border-destructive/50 bg-destructive/10 opacity-40 dark:opacity-60"
                                                            : "border-primary/30 bg-primary/10 hover:bg-primary/20"
                                                    }`}
                                                    style={style}
                                                >
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div className="flex-1">
                                                            <div className="text-xs font-medium mb-1 text-foreground">
                                                                {formatTimeString(
                                                                    slot.startTime,
                                                                    settings.timeFormat as
                                                                        | "12"
                                                                        | "24"
                                                                )}{" "}
                                                                -{" "}
                                                                {formatTimeString(
                                                                    slot.endTime,
                                                                    settings.timeFormat as
                                                                        | "12"
                                                                        | "24"
                                                                )}
                                                            </div>
                                                            {classesInSlot.length >
                                                                0 && (
                                                                <div className="space-y-1">
                                                                    {classesInSlot.map(
                                                                        (
                                                                            slotClass
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    slotClass.id
                                                                                }
                                                                                className="text-xs p-1.5 rounded border bg-background/80 backdrop-blur-sm"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        slotClass
                                                                                            .class
                                                                                            ?.color
                                                                                            ? `${slotClass.class.color}20`
                                                                                            : undefined,
                                                                                    borderColor:
                                                                                        slotClass
                                                                                            .class
                                                                                            ?.color ||
                                                                                        undefined,
                                                                                }}
                                                                            >
                                                                                <div className="font-medium">
                                                                                    {slotClass
                                                                                        .class
                                                                                        ?.name ||
                                                                                        "Unnamed"}
                                                                                </div>
                                                                                {slotClass.text && (
                                                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                                                        {
                                                                                            slotClass.text
                                                                                        }
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleEditSlot(slot)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            {editingSlot && (
                <CreateTimeSlotDialogContent
                    isOpen={editDialogOpen}
                    setIsOpen={handleEditDialogClose}
                    slot={editingSlot}
                />
            )}
        </div>
    );
}
