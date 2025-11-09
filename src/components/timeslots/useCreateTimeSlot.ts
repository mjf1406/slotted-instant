/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import type { FormData, FormErrors } from "./types";
import { validateForm } from "./validation";

const DEFAULT_FORM_DATA: FormData = {
    days: [],
    start_time: "09:00",
    end_time: "10:00",
    timetableId: "",
};

export function useCreateTimeSlot(isOpen: boolean) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const { selectedTimetable, timetables } = useTimetable();
    const user = db.useUser();

    // Set default timetable when dialog opens (only if form doesn't have one)
    useEffect(() => {
        if (isOpen && selectedTimetable) {
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
    }, [isOpen, selectedTimetable?.id]);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...DEFAULT_FORM_DATA,
                timetableId: selectedTimetable?.id || "",
            });
            setErrors({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

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

    const handleSubmit = async (): Promise<boolean> => {
        const validationErrors = validateForm(formData);
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
            // Create a slot for each selected day
            for (const day of formData.days) {
                const slotId = id();
                await db.transact(
                    db.tx.slots[slotId]
                        .update({
                            day,
                            startTime: formData.start_time,
                            endTime: formData.end_time,
                        })
                        .link({
                            owner: user.id,
                            timetable: selectedTimetableForSlot.id,
                        })
                );
            }

            // Reset form
            setFormData({
                ...DEFAULT_FORM_DATA,
                timetableId: selectedTimetable?.id || "",
            });
            setErrors({});
            return true;
        } catch (error) {
            console.error("Error creating slots:", error);
            setErrors({
                days: "Failed to create slots. Please try again.",
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
        handleDayToggle,
        handleTimeChange,
        handleTimetableChange,
        handleSubmit,
    };
}

