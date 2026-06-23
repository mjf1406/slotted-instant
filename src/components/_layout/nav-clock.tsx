/** @format */

"use client";

import { Link, useMatchRoute } from "@tanstack/react-router";
import {
    Monitor,
    Music,
    RotateCw,
    Timer,
} from "lucide-react";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const CLOCK_PAGES = [
    { to: "/display" as const, label: "Classroom display", icon: Monitor },
    { to: "/timers" as const, label: "Timers", icon: Timer },
    { to: "/rotations" as const, label: "Rotations", icon: RotateCw },
    { to: "/audio" as const, label: "Audio", icon: Music },
] as const;

export function NavClock() {
    const matchRoute = useMatchRoute();

    return (
        <SidebarGroup>
            <SidebarMenu>
                {CLOCK_PAGES.map(({ to, label, icon: Icon }) => (
                    <SidebarMenuItem key={to}>
                        <SidebarMenuButton
                            asChild
                            isActive={!!matchRoute({ to, fuzzy: false })}
                            tooltip={label}
                        >
                            <Link to={to}>
                                <Icon />
                                <span>{label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
