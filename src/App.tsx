/** @format */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useBrowserZoom } from "@/hooks/useBrowserZoom";

function TimetableView() {
    const { selectedTimetable } = useTimetable();
    const { settings } = useSettings();
    const {
        viewMode,
        currentWeekStart,
        currentDate,
        setViewMode,
        setCurrentWeekStart,
        setCurrentDate,
    } = useView();
    const zoomLevel = settings.zoomLevel ?? 1.0;

    // Store setters in refs to avoid dependency issues
    const settersRef = useRef({
        setViewMode,
        setCurrentWeekStart,
        setCurrentDate,
    });
    settersRef.current = {
        setViewMode,
        setCurrentWeekStart,
        setCurrentDate,
    };

    const handleWeekChange = useCallback(
        (newWeekStart: Date) => {
            settersRef.current.setCurrentWeekStart(newWeekStart);
            // Also update currentDate to match the week start when in week view
            if (viewMode === "week") {
                settersRef.current.setCurrentDate(newWeekStart);
            }
        },
        [viewMode]
    );

    const handleDateChange = useCallback(
        (newDate: Date) => {
            settersRef.current.setCurrentDate(newDate);
            // Also update week start to match the date's week
            const weekStart = getWeekStart(newDate, settings.weekStartDay);
            settersRef.current.setCurrentWeekStart(weekStart);
        },
        [settings.weekStartDay]
    );

    const handleGoToCurrent = useCallback(() => {
        const now = new Date();
        const weekStart = getWeekStart(now, settings.weekStartDay);
        settersRef.current.setCurrentWeekStart(weekStart);
        settersRef.current.setCurrentDate(now);
    }, [settings.weekStartDay]);

    const handleViewModeChange = useCallback((mode: "week" | "day") => {
        settersRef.current.setViewMode(mode);
        // When switching to day view, ensure currentDate is set to a valid day
        if (mode === "day") {
            const today = new Date();
            settersRef.current.setCurrentDate(today);
        }
    }, []);

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
        <div
            className="flex flex-1 flex-col gap-0 px-4 pb-4"
            style={{
                zoom: zoomLevel,
                transformOrigin: "top left",
            }}
        >
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

function ZoomDetector() {
    const isToastVisibleRef = useRef<boolean>(false);
    const toastTimeoutRef = useRef<number | null>(null);
    const TOAST_DURATION_MS = 6000; // Match the toast duration

    // Use ref for showToast to avoid recreating callbacks
    const showToastRef = useRef<((zoomLevel?: number) => void) | undefined>(
        undefined
    );

    showToastRef.current = (zoomLevel?: number) => {
        // Don't show a new toast if one is already visible
        if (isToastVisibleRef.current) {
            return;
        }

        // Mark toast as visible
        isToastVisibleRef.current = true;

        // Clear any existing timeout
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        const zoomText = zoomLevel
            ? `Browser zoom detected: ${Math.round(zoomLevel * 100)}%`
            : "Browser zoom detected";

        toast.info(
            <div className="flex flex-col gap-2">
                <span className="font-medium">{zoomText}</span>
                <span className="text-sm text-muted-foreground">
                    You can adjust zoom levels and other display settings on the
                    Settings page.
                </span>
                <a
                    href="?page=settings"
                    className="text-sm underline font-medium hover:opacity-80 text-primary"
                    onClick={(e) => {
                        e.preventDefault();
                        const params = new URLSearchParams(
                            window.location.search
                        );
                        params.set("page", "settings");
                        const newUrl = `${
                            window.location.pathname
                        }?${params.toString()}`;
                        window.history.pushState({}, "", newUrl);
                        window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                >
                    Go to Settings →
                </a>
            </div>,
            {
                position: "top-center",
                duration: TOAST_DURATION_MS,
            }
        );

        // Clear the visible flag after the toast duration
        toastTimeoutRef.current = setTimeout(() => {
            isToastVisibleRef.current = false;
            toastTimeoutRef.current = null;
        }, TOAST_DURATION_MS);
    };

    // Memoize callbacks to prevent infinite loops - use ref to avoid dependencies
    const handleZoomChange = useCallback((zoomLevel: number) => {
        // Only show toast if zoom is not 1.0 (100%)
        if (Math.abs(zoomLevel - 1.0) > 0.01) {
            showToastRef.current?.(zoomLevel);
        }
    }, []); // No dependencies - uses ref

    const handleZoomShortcut = useCallback(() => {
        // Immediately show toast when shortcut is detected
        // We'll update it with the actual zoom level once measured
        if (showToastRef.current) {
            showToastRef.current();
        }
    }, []); // No dependencies - uses ref

    // Show toast immediately when zoom shortcut is detected
    useBrowserZoom(handleZoomChange, handleZoomShortcut);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    return null;
}

function AppContent() {
    return (
        <SidebarProvider>
            <ZoomDetector />
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

    // Update state when weekStartDay changes
    // Use a ref to track the previous weekStartDay to avoid unnecessary updates
    const prevWeekStartDayRef = useRef(settings.weekStartDay);
    useEffect(() => {
        // Only update if weekStartDay actually changed
        if (prevWeekStartDayRef.current !== settings.weekStartDay) {
            prevWeekStartDayRef.current = settings.weekStartDay;
            const newWeekStart = getCurrentWeekStart(settings.weekStartDay);
            const newDate = getWeekStart(new Date(), settings.weekStartDay);

            // Only update if the time values actually changed to avoid unnecessary re-renders
            setCurrentWeekStart((prev) => {
                if (prev.getTime() !== newWeekStart.getTime()) {
                    return newWeekStart;
                }
                return prev;
            });
            setCurrentDate((prev) => {
                if (prev.getTime() !== newDate.getTime()) {
                    return newDate;
                }
                return prev;
            });
        }
    }, [settings.weekStartDay]);

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
                <Toaster
                    position="top-center"
                    richColors
                />
                <AppContent />
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
