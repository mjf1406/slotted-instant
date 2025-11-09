/** @format */

export const WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const;

export const WEEKDAYS_SUNDAY_START = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

/**
 * Get the ordered weekdays based on week start day
 */
export function getWeekdays(weekStartDay: "sunday" | "monday" = "monday") {
    return weekStartDay === "sunday" ? WEEKDAYS_SUNDAY_START : WEEKDAYS;
}

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(
    minutes: number,
    format: "12" | "24" = "24"
): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (format === "12") {
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours >= 12 ? "PM" : "AM";
        return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
    }
    
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Format a time string (HH:MM) to the specified format
 */
export function formatTimeString(
    time: string,
    format: "12" | "24" = "24"
): string {
    if (format === "24") {
        return time; // Already in 24-hour format
    }
    
    const [hours, minutes] = time.split(":").map(Number);
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours >= 12 ? "PM" : "AM";
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get Monday of the week for a given date
 */
export function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Get Sunday of the week for a given date
 */
export function getSundayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is day 0
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
}

/**
 * Get the start of the week for a given date based on week start day preference
 */
export function getWeekStart(
    date: Date,
    weekStartDay: "sunday" | "monday" = "monday"
): Date {
    return weekStartDay === "sunday"
        ? getSundayOfWeek(date)
        : getMondayOfWeek(date);
}

/**
 * Get the current week's start (Monday by default)
 */
export function getCurrentWeekStart(
    weekStartDay: "sunday" | "monday" = "monday"
): Date {
    return getWeekStart(new Date(), weekStartDay);
}

/**
 * Get year and week number for a date
 */
export function getYearAndWeekNumber(date: Date): {
    year: number;
    weekNumber: number;
} {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return { year: d.getUTCFullYear(), weekNumber };
}

/**
 * Format date range for week view (e.g., "Jan 1 - Jan 7, 2024")
 */
export function formatWeekRange(weekStart: Date): string {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
    const endDay = weekEnd.getDate();
    const year = weekStart.getFullYear();
    
    if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Format date for day view (e.g., "Mon, Jan 15")
 */
export function formatDayDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

/**
 * Get next week start date
 */
export function getNextWeek(weekStart: Date): Date {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    return next;
}

/**
 * Get previous week start date
 */
export function getPreviousWeek(weekStart: Date): Date {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    return prev;
}

/**
 * Get next day date
 */
export function getNextDay(date: Date): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
}

/**
 * Get previous day date
 */
export function getPreviousDay(date: Date): Date {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    return prev;
}

