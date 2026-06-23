/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { TimersPage } from "@/components/clock/TimersPage";

export const Route = createFileRoute("/timers")({
    component: TimersPage,
});
