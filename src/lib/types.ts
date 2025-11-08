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
    { instantUser: {} }
>;

export type Timetable = InstaQLEntity<
    AppSchema,
    "timetables",
    {
        owner: {};
        classes: {};
        slots: {};
        slotClasses: {};
    }
>;

export type Class = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: {};
        timetable: {};
        linkedClass: {};
        linkedClasses: {};
        slotClasses: {};
    }
>;

export type SlotEntity = InstaQLEntity<
    AppSchema,
    "slots",
    {
        owner: {};
        timetable: {};
        slotClasses: {};
        disabledSlots: {};
    }
>;

export type SlotClass = InstaQLEntity<
    AppSchema,
    "slotClasses",
    {
        owner: {};
        timetable: {};
        slot: {};
        class: {};
    }
>;

export type DisabledSlot = InstaQLEntity<
    AppSchema,
    "disabledSlots",
    {
        owner: {};
        slot: {};
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

