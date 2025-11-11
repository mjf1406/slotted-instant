/** @format */

"use client";

import { useState, useCallback, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/_themes/theme-provider";
import { AppSidebar } from "@/components/_layout/app-sidebar";
import { AppHeader } from "@/components/_layout/app-header";
import { TimetableProvider, useTimetable } from "@/lib/timetable-context";
import { db } from "@/lib/db";
import {
    CreateTimetableModal,
    WeekView,
    DayView,
    TimetableNavigation,
} from "@/components/timetables";
import {
    getCurrentWeekStart,
    getWeekStart,
} from "@/components/timetables/utils";
import { SettingsProvider, useSettings } from "@/lib/settings-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SettingsPage } from "@/components/settings";
import { ViewProvider, useView } from "@/lib/view-context";

function TimetableView() {
    const { selectedTimetable } = useTimetable();
    const { settings } = useSettings();
    const { viewMode, currentWeekStart, currentDate, setViewMode, setCurrentWeekStart, setCurrentDate } = useView();

    const handleWeekChange = useCallback(
        (newWeekStart: Date) => {
            setCurrentWeekStart(newWeekStart);
            // Also update currentDate to match the week start when in week view
            if (viewMode === "week") {
                setCurrentDate(newWeekStart);
            }
        },
        [viewMode, setCurrentWeekStart, setCurrentDate]
    );

    const handleDateChange = useCallback(
        (newDate: Date) => {
            setCurrentDate(newDate);
            // Also update week start to match the date's week
            const weekStart = getWeekStart(newDate, settings.weekStartDay);
            setCurrentWeekStart(weekStart);
        },
        [settings.weekStartDay, setCurrentDate, setCurrentWeekStart]
    );

    const handleGoToCurrent = useCallback(() => {
        const now = new Date();
        const weekStart = getWeekStart(now, settings.weekStartDay);
        setCurrentWeekStart(weekStart);
        setCurrentDate(now);
    }, [settings.weekStartDay, setCurrentWeekStart, setCurrentDate]);

    const handleViewModeChange = useCallback((mode: "week" | "day") => {
        setViewMode(mode);
        // When switching to day view, ensure currentDate is set to a valid day
        if (mode === "day") {
            const today = new Date();
            setCurrentDate(today);
        }
    }, [setViewMode, setCurrentDate]);

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
        <div className="flex flex-1 flex-col gap-0 px-4 pb-4">
            <TimetableNavigation
                viewMode={viewMode}
                currentWeekStart={currentWeekStart}
                currentDate={currentDate}
                onWeekChange={handleWeekChange}
                onDateChange={handleDateChange}
                onGoToCurrent={handleGoToCurrent}
                onViewModeChange={handleViewModeChange}
            />
            <div className="rounded-lg overflow-hidden">
                {viewMode === "week" ? (
                    <WeekView
                        timetableId={selectedTimetable.id}
                        currentWeekStart={currentWeekStart}
                    />
                ) : (
                    <DayView
                        timetableId={selectedTimetable.id}
                        currentDate={currentDate}
                    />
                )}
            </div>
        </div>
    );
}

function MainContent() {
    const [showSettings, setShowSettings] = useState(false);

    // Check URL params for settings page on mount and on navigation
    useEffect(() => {
        const checkParams = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                setShowSettings(params.get("page") === "settings");
            }
        };

        checkParams();
        window.addEventListener("popstate", checkParams);
        return () => window.removeEventListener("popstate", checkParams);
    }, []);

    // Update URL when settings state changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (showSettings) {
                params.set("page", "settings");
            } else {
                params.delete("page");
            }
            const newUrl = `${window.location.pathname}${
                params.toString() ? `?${params.toString()}` : ""
            }`;
            window.history.replaceState({}, "", newUrl);
        }
    }, [showSettings]);

    return (
        <>
            <db.SignedIn>
                {showSettings ? <SettingsPage /> : <TimetableView />}
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
                <SettingsProvider>
                    <TimetableProvider>
                        <ViewProviderWrapper>
                            <AppSidebar />
                            <SidebarInset>
                                <AppHeader />
                                <MainContent />
                            </SidebarInset>
                        </ViewProviderWrapper>
                    </TimetableProvider>
                </SettingsProvider>
            </db.SignedIn>
            <db.SignedOut>
                <SettingsProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <AppHeader />
                        <MainContent />
                    </SidebarInset>
                </SettingsProvider>
            </db.SignedOut>
        </SidebarProvider>
    );
}

function ViewProviderWrapper({ children }: { children: React.ReactNode }) {
    const { settings } = useSettings();
    const [viewMode, setViewMode] = useState<"week" | "day">("week");
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        getCurrentWeekStart(settings.weekStartDay)
    );
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        const weekStart = getWeekStart(today, settings.weekStartDay);
        return weekStart;
    });

    return (
        <ViewProvider
            viewMode={viewMode}
            currentWeekStart={currentWeekStart}
            currentDate={currentDate}
            setViewMode={setViewMode}
            setCurrentWeekStart={setCurrentWeekStart}
            setCurrentDate={setCurrentDate}
        >
            {children}
        </ViewProvider>
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
