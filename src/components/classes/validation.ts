/** @format */

import type { FormData, FormErrors } from "./types";

export function validateForm(formData: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
        errors.name = "Name is required";
    }

    if (!formData.bgColor.trim()) {
        errors.bgColor = "Background color is required";
    }

    if (!formData.textColor.trim()) {
        errors.textColor = "Text color is required";
    }

    return errors;
}

