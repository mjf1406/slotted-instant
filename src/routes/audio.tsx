/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { AudioPage } from "@/components/clock/AudioPage";

export const Route = createFileRoute("/audio")({
    component: AudioPage,
});
