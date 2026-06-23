/** @format */

"use client";

import * as React from "react";
import { useMatchRoute } from "@tanstack/react-router";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/_layout/nav-user";
import { NavClasses } from "@/components/_layout/nav-classes";
import { NavClock } from "@/components/_layout/nav-clock";
import { TimetableSwitcher } from "@/components/_layout/timetable-switcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const matchRoute = useMatchRoute();
    const isTimetableRoute = !!matchRoute({
        to: "/t/$timetableId",
        fuzzy: false,
    });

    return (
        <Sidebar
            collapsible="icon"
            {...props}
        >
            <SidebarHeader>
                <TimetableSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavClock />
                {isTimetableRoute ? <NavClasses /> : null}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
