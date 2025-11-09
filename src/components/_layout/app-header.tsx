/** @format */

"use client";

import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/_themes/theme-toggle";
import { CreateTimeSlotDialog } from "@/components/timeslots";
import { CreateClassModal } from "@/components/classes";
import { useTimetable } from "@/lib/timetable-context";
import { db } from "@/lib/db";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

export function AppHeader() {
    const [isSettingsPage, setIsSettingsPage] = useState(false);

    useEffect(() => {
        const checkParams = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                setIsSettingsPage(params.get("page") === "settings");
            }
        };

        checkParams();
        window.addEventListener("popstate", checkParams);
        return () => window.removeEventListener("popstate", checkParams);
    }, []);

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-background border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <db.SignedIn>
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {isSettingsPage ? (
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Settings</BreadcrumbPage>
                                </BreadcrumbItem>
                            ) : (
                                <>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#">
                                            Timetables
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
                <CreateClassModal />
                <CreateTimeSlotDialog />
                <ModeToggle />
            </div>
        </header>
    );
}

