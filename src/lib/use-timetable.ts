import { useContext } from "react";
import { TimetableContext } from "./timetable-context";

export function useTimetable() {
    const context = useContext(TimetableContext);

    if (context === undefined) {
        throw new Error("useTimetable must be used within a TimetableProvider");
    }

    return context;
}

