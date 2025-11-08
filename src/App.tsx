/** @format */

"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { ModeToggle } from "@/components/themes/theme-toggle";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TimetableProvider, useTimetable } from "@/lib/timetable-context";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import { CreateTimetableModal } from "@/components/CreateTimetableModal";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

function TimetableView() {
    const { selectedTimetable } = useTimetable();
    const user = db.useUser();

    const handleDrop = async (e: React.DragEvent, slotId?: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedTimetable) return;

        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (data.type === "class" && data.classId) {
                // Create or update slot class
                const slotClassId = id();
                const currentDate = new Date();
                const weekNumber = getWeekNumber(currentDate);
                const year = currentDate.getFullYear();

                // If slotId is provided, link to that slot, otherwise create a new slot
                if (slotId) {
                    await db.transact(
                        db.tx.slotClasses[slotClassId]
                            .update({
                                weekNumber,
                                year,
                                size: "whole",
                                complete: false,
                                hidden: false,
                            })
                            .link({
                                owner: user.id,
                                timetable: selectedTimetable.id,
                                slot: slotId,
                                class: data.classId,
                            })
                    );
                } else {
                    // Create a new slot first
                    const newSlotId = id();
                    const slotData = data.slotData || {
                        day: "Monday",
                        startTime: "09:00",
                        endTime: "10:00",
                    };

                    await db.transact([
                        db.tx.slots[newSlotId]
                            .update({
                                day: slotData.day,
                                startTime: slotData.startTime,
                                endTime: slotData.endTime,
                            })
                            .link({
                                owner: user.id,
                                timetable: selectedTimetable.id,
                            }),
                        db.tx.slotClasses[slotClassId]
                            .update({
                                weekNumber,
                                year,
                                size: "whole",
                                complete: false,
                                hidden: false,
                            })
                            .link({
                                owner: user.id,
                                timetable: selectedTimetable.id,
                                slot: newSlotId,
                                class: data.classId,
                            }),
                    ]);
                }
            }
        } catch (error) {
            console.error("Error handling drop:", error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
    };

    const getWeekNumber = (date: Date): number => {
        const d = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(
            ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        );
    };

    if (!selectedTimetable) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        No timetable selected. Create a new timetable to get
                        started.
                    </p>
                    <CreateTimetableModal />
                </div>
            </div>
        );
    }

    const days = (selectedTimetable.days as string[]) || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
    ];

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="rounded-lg border bg-card p-4">
                <h2 className="mb-4 text-lg font-semibold">
                    {selectedTimetable.name}
                </h2>
                <div className="grid grid-cols-5 gap-2">
                    {days.map((day) => (
                        <div
                            key={day}
                            className="min-h-[200px] rounded border-2 border-dashed border-muted p-2"
                            onDrop={(e) => handleDrop(e)}
                            onDragOver={handleDragOver}
                        >
                            <div className="mb-2 text-sm font-medium">
                                {day}
                            </div>
                            <div className="space-y-1">
                                {/* Slots for this day would go here */}
                                <div className="text-xs text-muted-foreground">
                                    Drop classes here
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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

function MainContent() {
    return (
        <>
            <db.SignedIn>
                <TimetableView />
            </db.SignedIn>
            <db.SignedOut>
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">
                            Please sign in to continue
                        </p>
                    </div>
                </div>
            </db.SignedOut>
        </>
    );
}

function AppContent() {
    return (
        <SidebarProvider>
            <db.SignedIn>
                <TimetableProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4"
                                />
                                <Breadcrumb>
                                    <BreadcrumbList>
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
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                            <div className="ml-auto px-4">
                                <ModeToggle />
                            </div>
                        </header>
                        <MainContent />
                    </SidebarInset>
                </TimetableProvider>
            </db.SignedIn>
            <db.SignedOut>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                        </div>
                        <div className="ml-auto px-4">
                            <ModeToggle />
                        </div>
                    </header>
                    <MainContent />
                </SidebarInset>
            </db.SignedOut>
        </SidebarProvider>
    );
}

function App() {
    return (
        <GoogleOAuthProvider
            clientId={
                "941453914369-hhldcd1g9h24lt4mj0sc2rt62id1krmr.apps.googleusercontent.com"
            }
        >
            <ThemeProvider
                defaultTheme="dark"
                storageKey="vite-ui-theme"
            >
                <AppContent />
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
