/** @format */

"use client";

import { useMemo, useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { Timetable, SlotEntity, SlotClass } from "@/lib/types";
import {
    timeToMinutes,
    minutesToTime,
    getYearAndWeekNumber,
    getWeekStart,
    getWeekdays,
} from "../utils";
import { useSettings } from "@/lib/settings-context";
import { CreateTimeSlotDialogContent } from "@/components/timeslots/CreateTimeSlotDialogContent";
import { TimeSlot } from "../slots/TimeSlot";
import { DisplayClassDetails } from "../class-details";
import { Button } from "@/components/ui/button";
import { SquareX, SquareCheck } from "lucide-react";

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
    const [displayingSlotClassId, setDisplayingSlotClassId] = useState<
        string | null
    >(null);
    const [displayDialogOpen, setDisplayDialogOpen] = useState(false);

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
    const user = db.useUser();

    // Extract data with safe defaults
    const days = useMemo(
        () => (timetable?.days as string[]) || [],
        [timetable?.days]
    );
    const slots = useMemo(
        () => (timetable?.slots || []) as unknown as SlotEntity[],
        [timetable?.slots]
    );
    const classes = useMemo(
        () => timetable?.classes || [] || [],
        [timetable?.classes]
    );
    const allSlotClasses = useMemo(
        () => (timetable?.slotClasses || []) as unknown as SlotClass[],
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

    // Get the current displaying slotClass from reactive query data - must be called before early returns
    const displayingSlotClass = useMemo(() => {
        if (!displayingSlotClassId) return null;
        return (
            allSlotClasses.find((sc) => sc.id === displayingSlotClassId) || null
        );
    }, [displayingSlotClassId, allSlotClasses]);

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

    // Get available classes for a slot (classes that haven't been added yet)
    const getAvailableClassesForSlot = (slotId: string) => {
        const classesInSlot = getSlotClassesForSlot(slotId);
        const addedClassIds = new Set(
            classesInSlot.map((sc) => sc.class?.id).filter(Boolean)
        );
        return classes.filter((cls) => !addedClassIds.has(cls.id));
    };

    // Check if a slot is disabled (always or for current week)
    // Priority: disabledSlots for current week > disabled field
    const isSlotDisabled = (slot: SlotEntity): boolean => {
        const nextWeekMonday = new Date(currentWeekStart);
        nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

        // First check if disabled for current week (disabledSlots takes priority)
        if (slot.disabledSlots && slot.disabledSlots.length > 0) {
            const isDisabledForWeek = slot.disabledSlots.some((disabledSlot) => {
                const disableDate = new Date(disabledSlot.disableDate);
                return (
                    disableDate >= currentWeekStart && disableDate < nextWeekMonday
                );
            });
            if (isDisabledForWeek) {
                return true;
            }
        }

        // Then check if always disabled
        if (slot.disabled === true) {
            return true;
        }

        return false;
    };

    const handleEditSlot = (slot: SlotEntity) => {
        setEditingSlot(slot);
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setEditingSlot(null);
    };

    // Function to add a class to a slot
    const handleAddClassToSlot = async (slotId: string, classId: string) => {
        if (!timetable || !user) return;

        // Check if this class already exists in the current view for any slot
        const existingSlotClass = slotClasses.find(
            (sc) => sc.class?.id === classId && sc.year === year && sc.weekNumber === weekNumber && !sc.hidden
        );
        const textToCopy = existingSlotClass?.text || null;

        const slotClassId = id();
        await db.transact(
            db.tx.slotClasses[slotClassId]
                .update({
                    weekNumber,
                    year,
                    size: "whole",
                    complete: false,
                    hidden: false,
                    text: textToCopy || undefined,
                })
                .link({
                    owner: user.id,
                    timetable: timetable.id,
                    slot: slotId,
                    class: classId,
                })
        );
    };

    // Function to delete slotClass
    const handleDeleteSlotClass = async (slotClassId: string) => {
        try {
            await db.transact(db.tx.slotClasses[slotClassId].delete());
        } catch (error) {
            console.error("Failed to delete slot class:", error);
        }
    };

    // Function to delete slot
    const handleDeleteSlot = async (slot: SlotEntity) => {
        try {
            await db.transact(db.tx.slots[slot.id].delete());
        } catch (error) {
            console.error("Failed to delete slot:", error);
        }
    };

    // Check if all slots for a day are disabled for the current week
    const areAllSlotsDisabledForDay = (dayName: string): boolean => {
        const daySlots = slotsByDay[dayName] || [];
        if (daySlots.length === 0) return false;

        const dayDate = getDateForDay(dayName);
        const weekStart = getWeekStart(dayDate, settings.weekStartDay);
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        return daySlots.every((slot) => {
            // Check if always disabled
            if (slot.disabled === true) {
                return true;
            }

            // Check if disabled for current week
            if (!slot.disabledSlots || slot.disabledSlots.length === 0) {
                return false;
            }

            return slot.disabledSlots.some((disabledSlot) => {
                const disableDate = new Date(disabledSlot.disableDate);
                return disableDate >= weekStart && disableDate < nextWeekStart;
            });
        });
    };

    // Function to toggle disable/enable all slots for a specific day
    const handleToggleDaySlots = async (dayName: string) => {
        if (!timetable || !user) return;

        const dayDate = getDateForDay(dayName);
        const weekStart = getWeekStart(dayDate, settings.weekStartDay);
        const daySlots = slotsByDay[dayName] || [];
        const allDisabled = areAllSlotsDisabledForDay(dayName);

        if (allDisabled) {
            // Enable all slots by removing disabledSlots entries for this week
            for (const slot of daySlots) {
                if (slot.disabledSlots) {
                    const disabledSlotsToRemove = slot.disabledSlots.filter((disabledSlot) => {
                        const disableDate = new Date(disabledSlot.disableDate);
                        return disableDate.getTime() === weekStart.getTime();
                    });

                    for (const disabledSlot of disabledSlotsToRemove) {
                        await db.transact(db.tx.disabledSlots[disabledSlot.id].delete());
                    }
                }
            }
        } else {
            // Disable all slots for this day in the current week
            for (const slot of daySlots) {
                // Skip if always disabled
                if (slot.disabled === true) continue;

                // Check if already disabled for this week
                const existingDisabledSlot = slot.disabledSlots?.find((disabledSlot) => {
                    const disableDate = new Date(disabledSlot.disableDate);
                    return disableDate.getTime() === weekStart.getTime();
                });

                if (!existingDisabledSlot) {
                    const disabledSlotId = id();
                    await db.transact(
                        db.tx.disabledSlots[disabledSlotId]
                            .update({
                                disableDate: weekStart,
                            })
                            .link({
                                owner: user.id,
                                slot: slot.id,
                            })
                    );
                }
            }
        }
    };

    // Function to handle slot class click (open display dialog)
    const handleSlotClassClick = (slotClass: SlotClass) => {
        setDisplayingSlotClassId(slotClass.id);
        setDisplayDialogOpen(true);
    };

    // Function to close display dialog
    const handleCloseDisplayDialog = () => {
        setDisplayDialogOpen(false);
        setDisplayingSlotClassId(null);
    };

    // Function to save slotClass (text and complete)
    const handleSaveSlotClass = async (updatedSlotClass: SlotClass) => {
        try {
            await db.transact(
                db.tx.slotClasses[updatedSlotClass.id].update({
                    text: updatedSlotClass.text || null,
                    complete: updatedSlotClass.complete || false,
                })
            );
        } catch (error) {
            console.error("Failed to update slot class:", error);
            throw error;
        }
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
                        const daySlots = slotsByDay[day] || [];
                        return (
                            <div
                                key={day}
                                className="border-r p-2 text-center text-sm font-medium last:border-r-0 flex items-center justify-between"
                            >
                                <div className="flex-1 text-center">
                                    <div>{day}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {dayNumber}
                                    </div>
                                </div>
                                    {daySlots.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleDaySlots(day)}
                                            className="h-6 px-1.5 text-xs shrink-0"
                                            title={
                                                areAllSlotsDisabledForDay(day)
                                                    ? `Enable all slots for ${day}`
                                                    : `Disable all slots for ${day}`
                                            }
                                        >
                                            {areAllSlotsDisabledForDay(day) ? (
                                                <SquareCheck className="h-3 w-3" />
                                            ) : (
                                                <SquareX className="h-3 w-3" />
                                            )}
                                        </Button>
                                    )}
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
                                    const availableClasses =
                                        getAvailableClassesForSlot(slot.id);
                                    const isDisabled = isSlotDisabled(slot);

                                    return (
                                        <TimeSlot
                                            key={slot.id}
                                            slot={slot}
                                            classesInSlot={classesInSlot}
                                            availableClasses={availableClasses}
                                            isDisabled={isDisabled}
                                            onEditSlot={handleEditSlot}
                                            onDeleteSlot={handleDeleteSlot}
                                            onDeleteSlotClass={
                                                handleDeleteSlotClass
                                            }
                                            onAddClassToSlot={(
                                                classId: string
                                            ) =>
                                                handleAddClassToSlot(
                                                    slot.id,
                                                    classId
                                                )
                                            }
                                            onSlotClassClick={
                                                handleSlotClassClick
                                            }
                                            style={style}
                                        />
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

            {/* Display Class Details Dialog */}
            {displayingSlotClass && displayingSlotClassId && (
                <DisplayClassDetails
                    slotClass={displayingSlotClass}
                    isOpen={displayDialogOpen}
                    onClose={handleCloseDisplayDialog}
                    onSave={handleSaveSlotClass}
                    currentDate={getDateForDay(
                        displayingSlotClass.slot?.day || ""
                    )}
                />
            )}
        </div>
    );
}
