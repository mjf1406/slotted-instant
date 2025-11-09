import type { Timetable } from "./types";

export type TimetableContextState = {
    selectedTimetable: Timetable | null;
    setSelectedTimetable: (timetable: Timetable | null) => void;
    timetables: Timetable[];
    isLoading: boolean;
    error: Error | null;
};

