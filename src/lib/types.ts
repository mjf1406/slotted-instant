/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "../instant.schema";

export interface GoogleJWTClaims {
    given_name?: string;
    family_name?: string;
    picture?: string;
    email?: string;
    [key: string]: unknown;
}

// Slot type for timetable slots JSON field
export interface Slot {
    day: string;
    startTime: string;
    endTime: string;
}

// Entity Types
export type User = InstaQLEntity<
    AppSchema,
    "users",
    { instantUser: Record<string, never> }
>;

export type Timetable = InstaQLEntity<
    AppSchema,
    "timetables",
    {
        owner: Record<string, never>;
        classes: Record<string, never>;
        slots: Record<string, never>;
        slotClasses: Record<string, never>;
    }
>;

export type Class = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: Record<string, never>;
        timetable: Record<string, never>;
        linkedClass: Record<string, never>;
        linkedClasses: Record<string, never>;
        slotClasses: Record<string, never>;
    }
>;

export type SlotEntity = InstaQLEntity<
    AppSchema,
    "slots",
    {
        owner: Record<string, never>;
        timetable: Record<string, never>;
        slotClasses: Record<string, never>;
        disabledSlots: Record<string, never>;
        durationOverrides: Record<string, never>;
    }
>;

export type SlotClass = InstaQLEntity<
    AppSchema,
    "slotClasses",
    {
        owner: Record<string, never>;
        timetable: Record<string, never>;
        slot: Record<string, never>;
        class: Record<string, never>;
    }
>;

export type DisabledSlot = InstaQLEntity<
    AppSchema,
    "disabledSlots",
    {
        owner: Record<string, never>;
        slot: Record<string, never>;
    }
>;

export type SlotDurationOverride = InstaQLEntity<
    AppSchema,
    "slotDurationOverrides",
    {
        owner: Record<string, never>;
        slot: Record<string, never>;
    }
>;

// User Role type
export type UserRole = "teacher" | "admin";

// Slot size type
export type SlotSize = "whole" | "split";

// Type guards and utilities
export function isUserRole(value: string): value is UserRole {
    return value === "teacher" || value === "admin";
}

export function isSlotSize(value: string): value is SlotSize {
    return value === "whole" || value === "split";
}
