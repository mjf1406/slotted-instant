/** @format */

"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/_themes/theme-provider";
import { AppSidebar } from "@/components/_layout/app-sidebar";
import { AppHeader } from "@/components/_layout/app-header";
import { TimetableProvider, useTimetable } from "@/lib/timetable-context";
import { db } from "@/lib/db";
import { CreateTimetableModal, WeekView } from "@/components/timetables";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

function TimetableView() {
    const { selectedTimetable } = useTimetable();

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

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="rounded-lg border bg-card p-4">
                <h2 className="mb-4 text-lg font-semibold">
                    {selectedTimetable.name}
                </h2>
                <WeekView timetableId={selectedTimetable.id} />
            </div>
        </div>
    );
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
                        <AppHeader />
                        <MainContent />
                    </SidebarInset>
                </TimetableProvider>
            </db.SignedIn>
            <db.SignedOut>
                <AppSidebar />
                <SidebarInset>
                    <AppHeader />
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
