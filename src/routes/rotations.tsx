/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { RotationsPage } from "@/components/clock/RotationsPage";

export const Route = createFileRoute("/rotations")({
    component: RotationsPage,
});
