/** @format */

import type { FormData, FormErrors } from "./types";
import { timeToMinutes } from "./utils";

export function validateForm(formData: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
        errors.name = "Name is required";
    }

    if (formData.days.length === 0) {
        errors.days = "Select at least one day";
    }

    if (!formData.color.trim()) {
        errors.color = "Color is required";
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.startTime)) {
        errors.startTime = "Invalid time format";
    }

    if (!timeRegex.test(formData.endTime)) {
        errors.endTime = "Invalid time format";
    }

    // Only check time comparison if both times are valid
    if (!errors.startTime && !errors.endTime) {
        const startMinutes = timeToMinutes(formData.startTime);
        const endMinutes = timeToMinutes(formData.endTime);

        if (startMinutes >= endMinutes) {
            errors.endTime = "End time must be after start time";
        }
    }

    return errors;
}

