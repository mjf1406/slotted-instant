/** @format */

"use client";

import React, { createContext, useContext, useMemo } from "react";

interface ViewContextType {
    viewMode: "week" | "day";
    currentWeekStart: Date;
    currentDate: Date;
    setViewMode: (mode: "week" | "day") => void;
    setCurrentWeekStart: (date: Date) => void;
    setCurrentDate: (date: Date) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({
    children,
    viewMode,
    currentWeekStart,
    currentDate,
    setViewMode,
    setCurrentWeekStart,
    setCurrentDate,
}: {
    children: React.ReactNode;
    viewMode: "week" | "day";
    currentWeekStart: Date;
    currentDate: Date;
    setViewMode: (mode: "week" | "day") => void;
    setCurrentWeekStart: (date: Date) => void;
    setCurrentDate: (date: Date) => void;
}) {
    // Memoize the context value to prevent unnecessary re-renders
    // Note: React's useState setters are stable and don't need to be in deps
    const value = useMemo(
        () => ({
            viewMode,
            currentWeekStart,
            currentDate,
            setViewMode,
            setCurrentWeekStart,
            setCurrentDate,
        }),
        [
            viewMode,
            currentWeekStart.getTime(),
            currentDate.getTime(),
            // Setters are stable from useState - they're the same function reference
            // and don't need to be in deps, but including them won't cause issues
            // eslint-disable-next-line react-hooks/exhaustive-deps
        ]
    );

    return (
        <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (!context) {
        throw new Error("useView must be used within ViewProvider");
    }
    return context;
}
