/** @format */

const LAST_TIMETABLE_KEY = "slotted:last-timetable-id";

export function getLastTimetableId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_TIMETABLE_KEY);
}

export function setLastTimetableId(id: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_TIMETABLE_KEY, id);
}

export function clearLastTimetableId(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LAST_TIMETABLE_KEY);
}
