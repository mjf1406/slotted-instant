/** @format */

"use client";

import { Link, useMatchRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { ModeToggle } from "@/components/_themes/theme-toggle";
import { CreateTimeSlotDialog } from "@/components/timeslots";
import { CreateClassModal } from "@/components/classes";
import { useTimetable } from "@/lib/timetable-context";
import { useTimerSheet } from "@/lib/timer-sheet-context";
import { db } from "@/lib/db";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function TimetableBreadcrumb() {
    return (
        <db.SignedIn>
            <TimetableBreadcrumbContent />
        </db.SignedIn>
    );
}

function TimetableBreadcrumbContent() {
    const { selectedTimetable } = useTimetable();
    return <>{selectedTimetable?.name || "Select Timetable"}</>;
}

const PAGE_TITLES: Record<string, string> = {
    "/display": "Classroom display",
    "/timers": "Timers",
    "/rotations": "Rotations",
    "/audio": "Audio",
    "/settings": "Settings",
};

export function AppHeader() {
    const matchRoute = useMatchRoute();
    const { toggle } = useTimerSheet();

    const isSettingsPage = !!matchRoute({ to: "/settings", fuzzy: false });
    const isTimetablePage = !!matchRoute({ to: "/t/$timetableId", fuzzy: false });

    const currentPageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
        matchRoute({ to: path, fuzzy: false })
    )?.[1];

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <db.SignedIn>
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {isSettingsPage || currentPageTitle ? (
                                <>
                                    {!isSettingsPage && isTimetablePage ? null : (
                                        <>
                                            <BreadcrumbItem className="hidden md:block">
                                                <BreadcrumbLink asChild>
                                                    <Link to="/">Timetables</Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="hidden md:block" />
                                        </>
                                    )}
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>
                                            {isSettingsPage
                                                ? "Settings"
                                                : currentPageTitle ?? (
                                                      <TimetableBreadcrumb />
                                                  )}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            ) : (
                                <>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink asChild>
                                            <Link to="/">Timetables</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>
                                            <TimetableBreadcrumb />
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </db.SignedIn>
            </div>
            <div className="ml-auto flex items-center gap-2 px-4">
                <db.SignedIn>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggle}
                        title="Open timer controls (T)"
                    >
                        <Timer className="size-4" />
                        <span className="hidden sm:inline">Timer</span>
                    </Button>
                </db.SignedIn>
                <CreateClassModal />
                <CreateTimeSlotDialog />
                <ModeToggle />
            </div>
        </header>
    );
}
