/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { IconName } from "@/components/ui/icon-picker";
import type { FormData, FormErrors, TimetableInput } from "./types";
import { validateForm } from "./validation";
import { minutesToTime, timeToMinutes } from "../utils";

const DEFAULT_FORM_DATA: FormData = {
    name: "",
    days: [],
    startTime: "09:00",
    endTime: "17:00",
    color: "#000000",
    iconName: "",
};

export function useCreateTimetable(
    isOpen: boolean,
    timetable?: TimetableInput | null
) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const user = db.useUser();
    const isEditMode = !!timetable;

    // Initialize form data when timetable changes or modal opens
    useEffect(() => {
        if (isOpen && timetable) {
            setFormData({
                name: timetable.name,
                days: timetable.days || [],
                startTime: minutesToTime(timetable.startTime),
                endTime: minutesToTime(timetable.endTime),
                color: timetable.color || "#000000",
                iconName: (timetable.iconName as IconName) || "",
            });
        } else if (isOpen && !timetable) {
            setFormData(DEFAULT_FORM_DATA);
        }
    }, [isOpen, timetable]);

    // Reset form when modal closes (only if not in edit mode)
    useEffect(() => {
        if (!isOpen && !isEditMode) {
            setFormData(DEFAULT_FORM_DATA);
            setErrors({});
        }
    }, [isOpen, isEditMode]);

    const handleFieldChange = <K extends keyof FormData>(
        field: K,
        value: FormData[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [field as keyof FormErrors]: undefined,
            }));
        }
    };

    const handleDayToggle = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter((d) => d !== day)
                : [...prev.days, day],
        }));
        // Clear days error when user selects a day
        if (errors.days) {
            setErrors((prev) => ({ ...prev, days: undefined }));
        }
    };

    const handleSubmit = async (): Promise<boolean> => {
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return false;
        }

        if (!user?.id) {
            setErrors({
                name: "You must be signed in to create a timetable.",
            });
            return false;
        }

        setIsLoading(true);

        try {
            const startMinutes = timeToMinutes(formData.startTime);
            const endMinutes = timeToMinutes(formData.endTime);

            if (isEditMode && timetable) {
                // Update existing timetable
                await db.transact(
                    db.tx.timetables[timetable.id].update({
                        name: formData.name.trim(),
                        days: formData.days,
                        startTime: startMinutes,
                        endTime: endMinutes,
                        color: formData.color,
                        iconName: formData.iconName || "",
                    })
                );
            } else {
                // Create new timetable
                const timetableId = id();
                await db.transact(
                    db.tx.timetables[timetableId]
                        .update({
                            name: formData.name.trim(),
                            days: formData.days,
                            startTime: startMinutes,
                            endTime: endMinutes,
                            color: formData.color,
                            iconName: formData.iconName || "",
                        })
                        .link({ owner: user.id })
                );
            }

            // Reset form
            setFormData(DEFAULT_FORM_DATA);
            setErrors({});
            return true;
        } catch (error) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} timetable:`,
                error
            );
            setErrors({
                name: `Failed to ${isEditMode ? "update" : "create"} timetable. Please try again.`,
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData,
        errors,
        isLoading,
        isEditMode,
        handleFieldChange,
        handleDayToggle,
        handleSubmit,
    };
}

