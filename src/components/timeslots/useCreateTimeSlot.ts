/** @format */

import { useState, useEffect } from "react";
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

export function useCreateTimeSlot(
    isOpen: boolean,
    slot?: SlotEntity | null
) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const [disabledAlways, setDisabledAlways] = useState(false);
    const [disabledThisWeek, setDisabledThisWeek] = useState(false);
    const { selectedTimetable, timetables } = useTimetable();
    const user = db.useUser();
    const isEditMode = !!slot;

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
        }
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, slot?.id, slot?.timetable?.id]);

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
    }, [isOpen, selectedTimetable?.id, isEditMode]);

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
            if (isEditMode && slot) {
                // Update existing slot
                await db.transact(
                    db.tx.slots[slot.id].update({
                        day: formData.days[0] || slot.day,
                        startTime: formData.start_time,
                        endTime: formData.end_time,
                        disabled: disabledAlways,
                    })
                );

                // Handle disabled state for current week
                const today = new Date();
                const currentWeekMonday = getMondayOfWeek(today);
                const nextWeekMonday = new Date(currentWeekMonday);
                nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

                // Find existing disabled slot for current week
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
                                disabled: disabledAlways,
                            })
                            .link({
                                owner: user.id,
                                timetable: selectedTimetableForSlot.id,
                            })
                    );

                    // If disabled this week is checked, create disabled slot entry for current week
                    if (disabledThisWeek) {
                        const today = new Date();
                        const currentWeekMonday = getMondayOfWeek(today);
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
            }

            // Reset form
            setFormData({
                ...DEFAULT_FORM_DATA,
                timetableId: selectedTimetable?.id || "",
            });
            setDisabledAlways(false);
            setDisabledThisWeek(false);
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
        handleDayToggle,
        handleTimeChange,
        handleTimetableChange,
        handleDisabledAlwaysChange,
        handleDisabledThisWeekChange,
        handleSubmit,
    };
}

