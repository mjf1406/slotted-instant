/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import type { IconName } from "@/components/ui/icon-picker";
import type { Class } from "@/lib/types";
import type { FormData, FormErrors } from "./types";
import { validateForm } from "./validation";
import { getYearAndWeekNumber } from "./utils";
import { suggestTextColor } from "@/lib/color-utils";

const DEFAULT_FORM_DATA: FormData = {
    name: "",
    bgColor: "#000000",
    textColor: "#FFFFFF",
    iconName: "",
    includeWeekInfo: false,
    defaultText: "",
};

export function useCreateClass(isOpen: boolean, classItem?: Class | null) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const { selectedTimetable } = useTimetable();
    const user = db.useUser();
    const isEditMode = !!classItem;

    const currentDate = new Date();
    const { year, weekNumber } = getYearAndWeekNumber(currentDate);

    // Initialize form data when class changes or modal opens
    useEffect(() => {
        if (isOpen && classItem) {
            setFormData({
                name: classItem.name,
                bgColor: (classItem as any).bgColor || (classItem as any).color || "#000000",
                textColor: (classItem as any).textColor || suggestTextColor((classItem as any).bgColor || (classItem as any).color || "#000000"),
                iconName: (classItem.iconName as IconName) || "",
                includeWeekInfo: !!(classItem.weekNumber && classItem.year),
                defaultText: classItem.defaultText || "",
            });
        } else if (isOpen && !classItem) {
            setFormData(DEFAULT_FORM_DATA);
        }
    }, [isOpen, classItem]);

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
        setFormData((prev) => {
            const updated = {
                ...prev,
                [field]: value,
            };
            
            // Auto-suggest textColor when bgColor changes
            if (field === "bgColor" && typeof value === "string") {
                updated.textColor = suggestTextColor(value);
            }
            
            return updated;
        });
        // Clear error for this field
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [field as keyof FormErrors]: undefined,
            }));
        }
    };

    const handleSubmit = async (): Promise<boolean> => {
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return false;
        }

        if (!selectedTimetable || !user?.id) {
            setErrors({
                name: "Please select a timetable first",
            });
            return false;
        }

        setIsLoading(true);

        try {
            if (isEditMode && classItem) {
                // Update existing class
                await db.transact(
                    db.tx.classes[classItem.id].update({
                        name: formData.name.trim(),
                        bgColor: formData.bgColor,
                        textColor: formData.textColor,
                        iconName: formData.iconName || "",
                        iconPrefix: "fas", // Keep for backward compatibility
                        weekNumber: formData.includeWeekInfo
                            ? weekNumber
                            : null,
                        year: formData.includeWeekInfo ? year : null,
                        defaultText: formData.defaultText || null,
                    })
                );
            } else {
                // Create new class
                const classId = id();
                await db.transact(
                    db.tx.classes[classId]
                        .update({
                            name: formData.name.trim(),
                            bgColor: formData.bgColor,
                            textColor: formData.textColor,
                            iconName: formData.iconName || "",
                            iconPrefix: "fas", // Keep for backward compatibility
                            weekNumber: formData.includeWeekInfo
                                ? weekNumber
                                : null,
                            year: formData.includeWeekInfo ? year : null,
                            defaultText: formData.defaultText || null,
                        })
                        .link({
                            owner: user.id,
                            timetable: selectedTimetable.id,
                        })
                );
            }

            // Reset form
            setFormData(DEFAULT_FORM_DATA);
            setErrors({});
            return true;
        } catch (error) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} class:`,
                error
            );
            setErrors({
                name: `Failed to ${
                    isEditMode ? "update" : "create"
                } class. Please try again.`,
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
        year,
        weekNumber,
        handleFieldChange,
        handleSubmit,
    };
}

