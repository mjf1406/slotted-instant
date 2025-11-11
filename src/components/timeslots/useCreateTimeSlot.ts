/** @format */

import { useState, useEffect, useMemo } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import type { FormData, FormErrors } from "./types";
import type { SlotEntity } from "@/lib/types";
import { validateForm } from "./validation";

const DEFAULT_FORM_DATA: FormData = {
    days: [],
    start_time: "09:00",
    end_time: "10:00",
    timetableId: "",
};

// Get Monday of the week for a given date
function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

// Helper function to find all matching slots (same day, startTime, endTime, timetable)
// This filters slots client-side from the provided slots array
function findMatchingSlots(
    slots: SlotEntity[],
    timetableId: string,
    day: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
): string[] {
    return slots
        .filter((slot) => {
            return (
                slot.timetable?.id === timetableId &&
                slot.day === day &&
                slot.startTime === startTime &&
                slot.endTime === endTime &&
                (!excludeSlotId || slot.id !== excludeSlotId)
            );
        })
        .map((slot) => slot.id);
}

export function useCreateTimeSlot(
    isOpen: boolean,
    slot?: SlotEntity | null
) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const [disabledAlways, setDisabledAlways] = useState(false);
    const [disabledThisWeek, setDisabledThisWeek] = useState(false);
    const [disableFuture, setDisableFuture] = useState(false);
    const [enableFuture, setEnableFuture] = useState(false);
    const { selectedTimetable, timetables } = useTimetable();
    const user = db.useUser();
    const isEditMode = !!slot;

    // Query all slots for the selected timetable to enable finding matching slots
    const { data: slotsData } = db.useQuery(
        formData.timetableId
            ? {
                  timetables: {
                      $: {
                          where: { id: { $in: [formData.timetableId] } },
                      },
                      slots: {
                          timetable: {},
                      },
                  },
              }
            : {}
    );

    const allSlots = useMemo(() => {
        const timetable = slotsData?.timetables?.[0];
        return (timetable?.slots || []) as unknown as SlotEntity[];
    }, [slotsData]);

    // Initialize form data when slot changes or modal opens
    useEffect(() => {
        if (isOpen && slot) {
            // Edit mode: populate form with slot data
            // Ensure timetable is set - if not available yet, use empty string (will be set when relation loads)
            const timetableId = slot.timetable?.id || "";
            setFormData({
                days: [slot.day],
                start_time: slot.startTime,
                end_time: slot.endTime,
                timetableId,
            });

            // Check if slot is always disabled
            setDisabledAlways(slot.disabled === true);

            // Check if slot is disabled for current week
            const today = new Date();
            const currentWeekMonday = getMondayOfWeek(today);
            const nextWeekMonday = new Date(currentWeekMonday);
            nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

            const isDisabledForWeek =
                slot.disabledSlots?.some((disabledSlot) => {
                    const disableDate = new Date(disabledSlot.disableDate);
                    return (
                        disableDate >= currentWeekMonday &&
                        disableDate < nextWeekMonday
                    );
                }) || false;

            setDisabledThisWeek(isDisabledForWeek);
        } else if (isOpen && !slot) {
            // Create mode: reset form
            setFormData({
                ...DEFAULT_FORM_DATA,
                timetableId: selectedTimetable?.id || "",
            });
            setDisabledAlways(false);
            setDisabledThisWeek(false);
            setDisableFuture(false);
            setEnableFuture(false);
        }
        setErrors({});
    }, [isOpen, slot, selectedTimetable]);

    // Set default timetable when dialog opens (only if form doesn't have one and not in edit mode)
    useEffect(() => {
        if (isOpen && selectedTimetable && !isEditMode) {
            setFormData((prev) => {
                // Only update if form doesn't have a timetableId
                if (!prev.timetableId) {
                    return {
                        ...prev,
                        timetableId: selectedTimetable.id,
                    };
                }
                return prev;
            });
        }
    }, [isOpen, selectedTimetable, isEditMode]);

    const handleDayToggle = (day: string) => {
        setFormData((prev) => {
            const newDays = prev.days.includes(day)
                ? prev.days.filter((d) => d !== day)
                : [...prev.days, day];
            return { ...prev, days: newDays };
        });
        // Clear error when user selects a day
        if (errors.days) {
            setErrors((prev) => ({ ...prev, days: undefined }));
        }
    };

    const handleTimeChange = (
        field: "start_time" | "end_time",
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    const handleTimetableChange = (timetableId: string) => {
        // Prevent changing timetable in edit mode
        if (isEditMode) {
            return;
        }
        setFormData((prev) => ({
            ...prev,
            timetableId,
            days: [], // Reset days when timetable changes
        }));
        // Clear errors when timetable is selected
        setErrors((prev) => ({
            ...prev,
            timetableId: undefined,
            days: undefined,
        }));
    };

    const handleDisabledAlwaysChange = (checked: boolean) => {
        setDisabledAlways(checked);
    };

    const handleDisabledThisWeekChange = (checked: boolean) => {
        setDisabledThisWeek(checked);
        // If enabling for this week, uncheck disable future
        if (checked) {
            setDisableFuture(false);
        }
    };

    const handleDisableFutureChange = (checked: boolean) => {
        setDisableFuture(checked);
        // If disabling future, uncheck enable future and this week options
        if (checked) {
            setEnableFuture(false);
            setDisabledThisWeek(false);
        }
    };

    const handleEnableFutureChange = (checked: boolean) => {
        setEnableFuture(checked);
        // If enabling future, uncheck disable future and this week options
        if (checked) {
            setDisableFuture(false);
            setDisabledThisWeek(false);
        }
    };

    const handleSubmit = async (): Promise<boolean> => {
        const validationErrors = validateForm(formData, isEditMode);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return false;
        }

        const selectedTimetableForSlot = timetables.find(
            (t) => t.id === formData.timetableId
        );

        if (!selectedTimetableForSlot || !user?.id) {
            setErrors({
                timetableId: "Please select a timetable first",
            });
            return false;
        }

        setIsLoading(true);

        try {
            const today = new Date();
            const currentWeekMonday = getMondayOfWeek(today);
            const nextWeekMonday = new Date(currentWeekMonday);
            nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

            if (isEditMode && slot) {
                const slotDay = formData.days[0] || slot.day;
                const slotStartTime = formData.start_time;
                const slotEndTime = formData.end_time;

                // Handle "disable future" - disable all matching slots
                if (disableFuture) {
                    const matchingSlotIds = findMatchingSlots(
                        allSlots,
                        formData.timetableId,
                        slotDay,
                        slotStartTime,
                        slotEndTime,
                        slot.id
                    );
                    // Update all matching slots to disabled
                    for (const matchingSlotId of matchingSlotIds) {
                        await db.transact(
                            db.tx.slots[matchingSlotId].update({
                                disabled: true,
                            })
                        );
                    }
                    // Also update current slot
                    await db.transact(
                        db.tx.slots[slot.id].update({
                            day: slotDay,
                            startTime: slotStartTime,
                            endTime: slotEndTime,
                            disabled: true,
                        })
                    );
                }
                // Handle "enable future" - enable all matching slots
                else if (enableFuture) {
                    const matchingSlotIds = findMatchingSlots(
                        allSlots,
                        formData.timetableId,
                        slotDay,
                        slotStartTime,
                        slotEndTime,
                        slot.id
                    );
                    // Update all matching slots to enabled and remove all their disabledSlots
                    for (const matchingSlotId of matchingSlotIds) {
                        const matchingSlot = allSlots.find((s: SlotEntity) => s.id === matchingSlotId);
                        await db.transact(
                            db.tx.slots[matchingSlotId].update({
                                disabled: false,
                            })
                        );
                        // Remove all disabledSlots entries for this slot
                        if (matchingSlot?.disabledSlots) {
                            for (const disabledSlot of matchingSlot.disabledSlots) {
                                await db.transact(
                                    db.tx.disabledSlots[disabledSlot.id].delete()
                                );
                            }
                        }
                    }
                    // Also update current slot
                    await db.transact(
                        db.tx.slots[slot.id].update({
                            day: slotDay,
                            startTime: slotStartTime,
                            endTime: slotEndTime,
                            disabled: false,
                        })
                    );
                    // Remove all disabledSlots entries for current slot
                    if (slot.disabledSlots) {
                        for (const disabledSlot of slot.disabledSlots) {
                            await db.transact(
                                db.tx.disabledSlots[disabledSlot.id].delete()
                            );
                        }
                    }
                }
                // Handle normal update (not future operations)
                else {
                    // Update existing slot
                    await db.transact(
                        db.tx.slots[slot.id].update({
                            day: slotDay,
                            startTime: slotStartTime,
                            endTime: slotEndTime,
                            disabled: disabledAlways,
                        })
                    );

                    // Handle disabled state for current week
                    const existingDisabledSlot = slot.disabledSlots?.find(
                        (disabledSlot) => {
                            const disableDate = new Date(disabledSlot.disableDate);
                            return (
                                disableDate >= currentWeekMonday &&
                                disableDate < nextWeekMonday
                            );
                        }
                    );

                    if (disabledThisWeek && !existingDisabledSlot) {
                        // Create disabled slot entry for current week
                        const disabledSlotId = id();
                        await db.transact(
                            db.tx.disabledSlots[disabledSlotId]
                                .update({
                                    disableDate: currentWeekMonday,
                                })
                                .link({
                                    owner: user.id,
                                    slot: slot.id,
                                })
                        );
                    } else if (!disabledThisWeek && existingDisabledSlot) {
                        // Delete disabled slot entry for current week
                        await db.transact(
                            db.tx.disabledSlots[existingDisabledSlot.id].delete()
                        );
                    }
                }
            } else {
                // Create a slot for each selected day
                for (const day of formData.days) {
                    const slotId = id();
                    await db.transact(
                        db.tx.slots[slotId]
                            .update({
                                day,
                                startTime: formData.start_time,
                                endTime: formData.end_time,
                                disabled: disabledAlways || disableFuture,
                            })
                            .link({
                                owner: user.id,
                                timetable: selectedTimetableForSlot.id,
                            })
                    );

                    // If disabled this week is checked, create disabled slot entry for current week
                    if (disabledThisWeek) {
                        const disabledSlotId = id();
                        await db.transact(
                            db.tx.disabledSlots[disabledSlotId]
                                .update({
                                    disableDate: currentWeekMonday,
                                })
                                .link({
                                    owner: user.id,
                                    slot: slotId,
                                })
                        );
                    }
                }

                // If disable future is checked, also disable all existing matching slots
                if (disableFuture) {
                    for (const day of formData.days) {
                        const matchingSlotIds = findMatchingSlots(
                            allSlots,
                            formData.timetableId,
                            day,
                            formData.start_time,
                            formData.end_time
                        );
                        for (const matchingSlotId of matchingSlotIds) {
                            await db.transact(
                                db.tx.slots[matchingSlotId].update({
                                    disabled: true,
                                })
                            );
                        }
                    }
                }
            }

            // Reset form
            setFormData({
                ...DEFAULT_FORM_DATA,
                timetableId: selectedTimetable?.id || "",
            });
            setDisabledAlways(false);
            setDisabledThisWeek(false);
            setDisableFuture(false);
            setEnableFuture(false);
            setErrors({});
            return true;
        } catch (error) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} slots:`,
                error
            );
            setErrors({
                days: `Failed to ${isEditMode ? "update" : "create"} slots. Please try again.`,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Get days from the selected timetable in form data
    const selectedTimetableForForm = timetables.find(
        (t) => t.id === formData.timetableId
    );
    const formDays =
        (selectedTimetableForForm?.days as string[]) ||
        (selectedTimetable?.days as string[]) ||
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    return {
        formData,
        errors,
        isLoading,
        days: formDays,
        timetables,
        selectedTimetable,
        disabledAlways,
        disabledThisWeek,
        disableFuture,
        enableFuture,
        handleDayToggle,
        handleTimeChange,
        handleTimetableChange,
        handleDisabledAlwaysChange,
        handleDisabledThisWeekChange,
        handleDisableFutureChange,
        handleEnableFutureChange,
        handleSubmit,
    };
}

