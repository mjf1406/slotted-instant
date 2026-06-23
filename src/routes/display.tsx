/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { DisplayPage } from "@/components/display/DisplayPage";

export const Route = createFileRoute("/display")({
    validateSearch: (search: Record<string, unknown>) => ({
        timetableId:
            typeof search.timetableId === "string" &&
            search.timetableId.length > 0
                ? search.timetableId
                : undefined,
    }),
    component: DisplayPage,
});
