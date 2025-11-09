/** @format */

import type { FormData, FormErrors } from "./types";

export function validateForm(formData: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!formData.timetableId) {
        errors.timetableId = "Please select a timetable";
    }

    if (formData.days.length === 0) {
        errors.days = "Select at least one day";
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formData.start_time)) {
        errors.start_time = "Invalid time format";
    }

    if (!timeRegex.test(formData.end_time)) {
        errors.end_time = "Invalid time format";
    }

    if (formData.start_time >= formData.end_time) {
        errors.end_time = "End time must be after start time";
    }

    return errors;
}

