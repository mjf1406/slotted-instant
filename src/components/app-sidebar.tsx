/** @format */

"use client";

import * as React from "react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import type { Class } from "@/lib/types";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { TimetableSwitcher } from "@/components/timetable-switcher";

function ClassItem({ classItem }: { classItem: Class }) {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData(
            "application/json",
            JSON.stringify({
                type: "class",
                classId: classItem.id,
                className: classItem.name,
                color: classItem.color,
                iconName: classItem.iconName,
                iconPrefix: classItem.iconPrefix,
            })
        );
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                draggable
                onDragStart={handleDragStart}
                className="cursor-grab active:cursor-grabbing"
            >
                <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: classItem.color }}
                />
                <span className="truncate">{classItem.name}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function ClassesList() {
    return (
        <>
            <db.SignedIn>
                <ClassesListContent />
            </db.SignedIn>
            <db.SignedOut>
                <SidebarGroup>
                    <SidebarGroupLabel>Classes</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton disabled>
                                Sign in to view classes
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </db.SignedOut>
        </>
    );
}

function ClassesListContent() {
    const user = db.useUser();
    const { selectedTimetable } = useTimetable();

    const { data, isLoading } = db.useQuery(
        user?.id
            ? {
                  classes: {
                      $: {
                          where: {
                              "owner.id": user.id,
                              ...(selectedTimetable
                                  ? { "timetable.id": selectedTimetable.id }
                                  : {}),
                          },
                      },
                  },
              }
            : {}
    );

    const classes = data?.classes || [];

    if (isLoading) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>Classes</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            Loading...
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    if (classes.length === 0) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>Classes</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            No classes available
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Classes</SidebarGroupLabel>
            <SidebarMenu>
                {classes.map((classItem) => (
                    <ClassItem
                        key={classItem.id}
                        classItem={classItem}
                    />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar
            collapsible="icon"
            {...props}
        >
            <SidebarHeader>
                <TimetableSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <ClassesList />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
