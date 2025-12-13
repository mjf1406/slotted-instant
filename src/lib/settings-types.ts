/** @format */

export type WeekStartDay = "sunday" | "monday";
export type TimeFormat = "12" | "24";

export type UserSettings = {
    weekStartDay: WeekStartDay;
    timeFormat: TimeFormat;
    showSlotDuration?: boolean;
    zoomLevel?: number; // Zoom for general UI (0.5 to 2.0, default 1.0)
    displayZoomLevel?: number; // Zoom for display modal (0.5 to 2.0, default 1.0)
};
