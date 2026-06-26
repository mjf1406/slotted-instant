/** @format */

import { describe, expect, it } from "vitest";
import {
    DISPLAY_EARLY_MINUTES,
    findCurrentSlot,
    isEarlyPreviewSlot,
} from "./current-slot-class";

const friday = "Friday";

function atTime(hours: number, minutes: number): Date {
    return new Date(2026, 5, 26, hours, minutes, 0, 0);
}

const period1 = {
    id: "p1",
    day: friday,
    startTime: "08:00",
    endTime: "08:45",
};

const period2 = {
    id: "p2",
    day: friday,
    startTime: "08:45",
    endTime: "09:30",
};

describe("findCurrentSlot", () => {
    it("returns the active slot during its window", () => {
        const now = atTime(8, 15);
        expect(findCurrentSlot([period1, period2], now)).toEqual(period1);
    });

    it("returns upcoming slot during early preview window", () => {
        const now = atTime(8, 42);
        expect(findCurrentSlot([period1, period2], now)).toEqual(period2);
        expect(isEarlyPreviewSlot(period2, now)).toBe(true);
    });

    it("returns null before early preview window", () => {
        const now = atTime(8, 41);
        expect(findCurrentSlot([period1, period2], now)).toBeNull();
    });

    it("prefers active slot over early preview for the next period", () => {
        const now = atTime(8, 43);
        expect(findCurrentSlot([period1, period2], now)).toEqual(period1);
        expect(isEarlyPreviewSlot(period2, now)).toBe(true);
    });

    it("returns null when no slot matches", () => {
        const now = atTime(12, 0);
        expect(findCurrentSlot([period1, period2], now)).toBeNull();
    });

    it(`uses a ${DISPLAY_EARLY_MINUTES}-minute early window`, () => {
        const slot = {
            id: "s1",
            day: friday,
            startTime: "10:00",
            endTime: "10:45",
        };
        expect(findCurrentSlot([slot], atTime(9, 57))).toBeNull();
        expect(findCurrentSlot([slot], atTime(9, 58))).toEqual(slot);
    });
});
