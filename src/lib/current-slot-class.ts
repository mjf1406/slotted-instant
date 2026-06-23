/** @format */

import {
    getYearAndWeekNumber,
    timeToMinutes,
} from "@/components/timetables/utils";

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
    slot?: { id: string } | null;
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

export function findCurrentSlot(
    slots: SlotLike[],
    now: Date = new Date()
): SlotLike | null {
    const dayName = getCurrentDayName(now);
    const currentMinutes = getCurrentMinutesOfDay(now);

    return (
        slots.find((slot) => {
            if (slot.day !== dayName) return false;
            const start = timeToMinutes(slot.startTime);
            const end = timeToMinutes(slot.endTime);
            return currentMinutes >= start && currentMinutes < end;
        }) ?? null
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
