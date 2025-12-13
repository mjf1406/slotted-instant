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
} from "../utils";
import { useSettings } from "@/lib/settings-context";
import { CreateTimeSlotDialogContent } from "@/components/timeslots/CreateTimeSlotDialogContent";
import { TimeSlot } from "../slots/TimeSlot";
import { DisplayClassDetails } from "../class-details";
import { Button } from "@/components/ui/button";
import { SquareX, SquareCheck } from "lucide-react";

interface DayViewProps {
    timetableId: string;
    currentDate: Date;
}

export function DayView({ timetableId, currentDate }: DayViewProps) {
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
                          durationOverrides: {},
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
    const days = (timetable?.days as string[]) || [];
    const slots = useMemo(
        () => (timetable?.slots || []) as unknown as SlotEntity[],
        [timetable?.slots]
    );
    const classes = useMemo(
        () => timetable?.classes || [],
        [timetable?.classes]
    );
    const allSlotClasses = useMemo(
        () => (timetable?.slotClasses || []) as unknown as SlotClass[],
        [timetable?.slotClasses]
    );

    // Filter slotClasses by current week (get week start for currentDate)
    const weekStart = getWeekStart(currentDate, settings.weekStartDay);
    const { year, weekNumber } = getYearAndWeekNumber(weekStart);
    const slotClasses = useMemo(() => {
        return allSlotClasses.filter(
            (sc) => sc.year === year && sc.weekNumber === weekNumber
        );
    }, [allSlotClasses, year, weekNumber]);

    // Get the day name for the current date (full name for filtering)
    const currentDayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
    });

    // Format date for display - just the day number
    const formattedDate = currentDate.getDate().toString();

    // Filter slots for the current day
    const daySlots = useMemo(() => {
        return slots.filter((slot) => slot.day === currentDayName);
    }, [slots, currentDayName]);

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

    // Check if the current day is in the timetable's days
    if (!days.includes(currentDayName)) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                    No slots scheduled for {currentDayName}
                </div>
            </div>
        );
    }

    // Calculate total duration in minutes
    const totalDuration = endTimeMinutes - startTimeMinutes;

    // Helper function to calculate position and height for a slot
    const getSlotStyle = (slot: SlotEntity) => {
        // Check for duration override for current week
        let effectiveStartTime = slot.startTime;
        let effectiveEndTime = slot.endTime;

        if (slot.durationOverrides && slot.durationOverrides.length > 0) {
            const override = slot.durationOverrides.find(
                (o: { year: number; weekNumber: number }) =>
                    o.year === year && o.weekNumber === weekNumber
            );
            if (override) {
                effectiveStartTime = override.startTime;
                effectiveEndTime = override.endTime;
            }
        }

        const startMinutes = timeToMinutes(effectiveStartTime);
        const endMinutes = timeToMinutes(effectiveEndTime);
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
        const weekStart = getWeekStart(currentDate, settings.weekStartDay);
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        // First check if disabled for current week (disabledSlots takes priority)
        if (slot.disabledSlots && slot.disabledSlots.length > 0) {
            const isDisabledForWeek = slot.disabledSlots.some(
                (disabledSlot) => {
                    const disableDate = new Date(disabledSlot.disableDate);
                    return (
                        disableDate >= weekStart && disableDate < nextWeekStart
                    );
                }
            );
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
            (sc) =>
                sc.class?.id === classId &&
                sc.year === year &&
                sc.weekNumber === weekNumber &&
                !sc.hidden
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

    // Check if all slots for the current day are disabled for the current week
    const areAllSlotsDisabledForDay = (): boolean => {
        if (daySlots.length === 0) return false;

        const weekStart = getWeekStart(currentDate, settings.weekStartDay);
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

    // Function to toggle disable/enable all slots for the current day
    const handleToggleDaySlots = async () => {
        if (!timetable || !user) return;

        const weekStart = getWeekStart(currentDate, settings.weekStartDay);
        const allDisabled = areAllSlotsDisabledForDay();

        if (allDisabled) {
            // Enable all slots by removing disabledSlots entries for this week
            for (const slot of daySlots) {
                if (slot.disabledSlots) {
                    const disabledSlotsToRemove = slot.disabledSlots.filter(
                        (disabledSlot) => {
                            const disableDate = new Date(
                                disabledSlot.disableDate
                            );
                            return (
                                disableDate.getTime() === weekStart.getTime()
                            );
                        }
                    );

                    for (const disabledSlot of disabledSlotsToRemove) {
                        await db.transact(
                            db.tx.disabledSlots[disabledSlot.id].delete()
                        );
                    }
                }
            }
        } else {
            // Disable all slots for this day in the current week
            for (const slot of daySlots) {
                // Skip if always disabled
                if (slot.disabled === true) continue;

                // Check if already disabled for this week
                const existingDisabledSlot = slot.disabledSlots?.find(
                    (disabledSlot) => {
                        const disableDate = new Date(disabledSlot.disableDate);
                        return disableDate.getTime() === weekStart.getTime();
                    }
                );

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

    return (
        <div className="w-full overflow-x-auto -mx-1">
            <div className="min-w-full">
                {/* Header row with day name */}
                <div
                    className="grid border-b bg-muted/50"
                    style={{
                        gridTemplateColumns: `${
                            settings.timeFormat === "12" ? "96px" : "80px"
                        } 1fr`,
                    }}
                >
                    <div className="border-r p-2 text-sm font-medium">Time</div>
                    <div className="border-r p-2 text-center text-sm font-medium flex items-center justify-between">
                        <span className="flex-1 text-center">
                            {formattedDate}
                        </span>
                        {daySlots.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleDaySlots}
                                className="h-7 px-2 text-xs shrink-0"
                                title={
                                    areAllSlotsDisabledForDay()
                                        ? "Enable all slots for this day"
                                        : "Disable all slots for this day"
                                }
                            >
                                {areAllSlotsDisabledForDay() ? (
                                    <>
                                        <SquareCheck className="h-3 w-3 mr-1" />
                                        Enable Day
                                    </>
                                ) : (
                                    <>
                                        <SquareX className="h-3 w-3 mr-1" />
                                        Disable Day
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
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

                    {/* Day column with slots */}
                    <div
                        className={`absolute right-0 top-0 bottom-0 ${
                            settings.timeFormat === "12" ? "left-24" : "left-20"
                        }`}
                    >
                        <div className="relative h-full border-r">
                            {/* Render slots for this day */}
                            {daySlots.map((slot) => {
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
                                        onAddClassToSlot={(classId: string) =>
                                            handleAddClassToSlot(
                                                slot.id,
                                                classId
                                            )
                                        }
                                        onSlotClassClick={handleSlotClassClick}
                                        style={style}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            {editingSlot && (
                <CreateTimeSlotDialogContent
                    isOpen={editDialogOpen}
                    setIsOpen={handleEditDialogClose}
                    slot={editingSlot}
                    viewedWeekStart={weekStart}
                />
            )}

            {/* Display Class Details Dialog */}
            {displayingSlotClass && displayingSlotClassId && (
                <DisplayClassDetails
                    slotClass={displayingSlotClass}
                    isOpen={displayDialogOpen}
                    onClose={handleCloseDisplayDialog}
                    onSave={handleSaveSlotClass}
                    currentDate={currentDate}
                />
            )}
        </div>
    );
}
