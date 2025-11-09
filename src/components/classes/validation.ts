/** @format */

import type { FormData, FormErrors } from "./types";

export function validateForm(formData: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
        errors.name = "Name is required";
    }

    if (!formData.color.trim()) {
        errors.color = "Color is required";
    }

    return errors;
}

