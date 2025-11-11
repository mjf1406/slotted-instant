/** @format */

"use client";

import React, { createContext, useContext } from "react";

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
    return (
        <ViewContext.Provider
            value={{
                viewMode,
                currentWeekStart,
                currentDate,
                setViewMode,
                setCurrentWeekStart,
                setCurrentDate,
            }}
        >
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (!context) {
        throw new Error("useView must be used within ViewProvider");
    }
    return context;
}

