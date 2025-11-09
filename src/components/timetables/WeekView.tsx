/** @format */

"use client";

import { useMemo } from "react";
import { db } from "@/lib/db";
import type { Timetable, SlotEntity, SlotClass } from "@/lib/types";
import { timeToMinutes, minutesToTime } from "./utils";

interface WeekViewProps {
    timetableId: string;
}

export function WeekView({ timetableId }: WeekViewProps) {
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
                      slots: {},
                      slotClasses: {
                          slot: {},
                          class: {},
                      },
                  },
              }
            : {}
    );

    const timetable = data?.timetables?.[0] as Timetable | undefined;

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
                <div className="text-muted-foreground">Loading timetable...</div>
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

    const days = (timetable.days as string[]) || [];
    const slots = (timetable.slots || []) as SlotEntity[];
    const slotClasses = (timetable.slotClasses || []) as SlotClass[];

    // Get start and end times from timetable (stored as minutes)
    const startTimeMinutes = timetable.startTime;
    const endTimeMinutes = timetable.endTime;

    // Generate time intervals (every 30 minutes)
    const timeIntervals = useMemo(() => {
        const intervals: string[] = [];
        let currentMinutes = startTimeMinutes;
        while (currentMinutes < endTimeMinutes) {
            intervals.push(minutesToTime(currentMinutes));
            currentMinutes += 30; // 30-minute intervals
        }
        return intervals;
    }, [startTimeMinutes, endTimeMinutes]);

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
        return slotClasses.filter(
            (sc) => sc.slot?.id === slotId && !sc.hidden
        );
    };

    // Group slots by day
    const slotsByDay = useMemo(() => {
        const grouped: Record<string, SlotEntity[]> = {};
        days.forEach((day) => {
            grouped[day] = slots.filter((slot) => slot.day === day);
        });
        return grouped;
    }, [slots, days]);

    // Calculate the height for the time grid (each 30-minute interval = 60px)
    const gridHeight = (totalDuration / 30) * 60;

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-full">
                {/* Header row with day names */}
                <div
                    className="grid border-b bg-muted/50"
                    style={{
                        gridTemplateColumns: `80px repeat(${days.length}, 1fr)`,
                    }}
                >
                    <div className="border-r p-2 text-sm font-medium">
                        Time
                    </div>
                    {days.map((day) => (
                        <div
                            key={day}
                            className="border-r p-2 text-center text-sm font-medium last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Time slots grid */}
                <div className="relative" style={{ height: `${gridHeight}px` }}>
                    {/* Time labels column - positioned absolutely */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-20 border-r bg-muted/30"
                        style={{ zIndex: 1 }}
                    >
                        {timeIntervals.map((time) => {
                            const timeMinutes = timeToMinutes(time);
                            const topPercent =
                                ((timeMinutes - startTimeMinutes) /
                                    totalDuration) *
                                100;
                            return (
                                <div
                                    key={time}
                                    className="absolute left-0 right-0 p-1 text-xs text-muted-foreground border-b"
                                    style={{ top: `${topPercent}%` }}
                                >
                                    {time}
                                </div>
                            );
                        })}
                    </div>

                    {/* Day columns with slots */}
                    <div
                        className="absolute left-20 right-0 top-0 bottom-0 grid"
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

                                    return (
                                        <div
                                            key={slot.id}
                                            className="absolute left-1 right-1 border border-primary/30 bg-primary/10 rounded p-1.5 shadow-sm hover:bg-primary/20 transition-colors"
                                            style={style}
                                        >
                                            <div className="text-xs font-medium mb-1 text-foreground">
                                                {slot.startTime} -{" "}
                                                {slot.endTime}
                                            </div>
                                            {classesInSlot.length > 0 && (
                                                <div className="space-y-1">
                                                    {classesInSlot.map(
                                                        (slotClass) => (
                                                            <div
                                                                key={slotClass.id}
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
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

