/** @format */

import {
    getYearAndWeekNumber,
    timeToMinutes,
} from "@/components/timetables/utils";

export const DISPLAY_EARLY_MINUTES = 3;

type SlotLike = {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
};

type SlotClassLike = {
    id: string;
    year: number;
    weekNumber: number;
    hidden?: boolean;
    text?: string;
    complete?: boolean;
    slot?: {
        id: string;
        day?: string;
        startTime?: string;
        endTime?: string;
    } | null;
    class?: {
        id: string;
        name: string;
        defaultText?: string;
        bgColor: string;
        textColor: string;
        iconName: string;
        iconPrefix: string;
        [key: string]: unknown;
    } | null;
};

export function getCurrentDayName(date: Date = new Date()): string {
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function getCurrentMinutesOfDay(date: Date = new Date()): number {
    return date.getHours() * 60 + date.getMinutes();
}

function isActiveSlot(slot: SlotLike, dayName: string, currentMinutes: number) {
    if (slot.day !== dayName) return false;
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    return currentMinutes >= start && currentMinutes < end;
}

function isEarlyPreviewSlotAt(
    slot: SlotLike,
    dayName: string,
    currentMinutes: number
) {
    if (slot.day !== dayName) return false;
    const start = timeToMinutes(slot.startTime);
    return (
        currentMinutes >= start - DISPLAY_EARLY_MINUTES &&
        currentMinutes < start
    );
}

export function isEarlyPreviewSlot(
    slot: SlotLike,
    now: Date = new Date()
): boolean {
    const dayName = getCurrentDayName(now);
    const currentMinutes = getCurrentMinutesOfDay(now);
    return isEarlyPreviewSlotAt(slot, dayName, currentMinutes);
}

export function minutesUntilSlotStart(
    slot: SlotLike,
    now: Date = new Date()
): number {
    const start = timeToMinutes(slot.startTime);
    return Math.max(0, start - getCurrentMinutesOfDay(now));
}

export function findCurrentSlot(
    slots: SlotLike[],
    now: Date = new Date()
): SlotLike | null {
    const dayName = getCurrentDayName(now);
    const currentMinutes = getCurrentMinutesOfDay(now);

    const active =
        slots.find((slot) => isActiveSlot(slot, dayName, currentMinutes)) ??
        null;
    if (active) return active;

    return (
        slots.find((slot) =>
            isEarlyPreviewSlotAt(slot, dayName, currentMinutes)
        ) ?? null
    );
}

export function findSlotClassForSlot(
    slot: SlotLike,
    slotClasses: SlotClassLike[],
    now: Date = new Date()
): SlotClassLike | null {
    const { year, weekNumber } = getYearAndWeekNumber(now);

    return (
        slotClasses.find(
            (sc) =>
                sc.slot?.id === slot.id &&
                sc.year === year &&
                sc.weekNumber === weekNumber &&
                !sc.hidden
        ) ?? null
    );
}

export function resolveCurrentSlotClass(
    slots: SlotLike[],
    slotClasses: SlotClassLike[],
    now: Date = new Date()
): SlotClassLike | null {
    const currentSlot = findCurrentSlot(slots, now);
    if (!currentSlot) return null;
    return findSlotClassForSlot(currentSlot, slotClasses, now);
}

export type { SlotClassLike, SlotLike };
