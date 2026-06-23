/** @format */

"use client";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/_themes/theme-provider";
import { AppSidebar } from "@/components/_layout/app-sidebar";
import { AppHeader } from "@/components/_layout/app-header";
import { ZoomDetector } from "@/components/_layout/ZoomDetector";
import { TimerSheet } from "@/components/clock/TimerSheet";
import { TimetableProvider } from "@/lib/timetable-context";
import { SettingsProvider } from "@/lib/settings-context";
import { TimerSheetProvider } from "@/lib/timer-sheet-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { db } from "@/lib/db";

function AppShell() {
    return (
        <SidebarProvider>
            <ZoomDetector />
            <TimerSheetProvider>
                <db.SignedIn>
                    <SettingsProvider>
                        <TimetableProvider>
                            <AppSidebar />
                            <SidebarInset>
                                <AppHeader />
                                <Outlet />
                            </SidebarInset>
                            <TimerSheet />
                        </TimetableProvider>
                    </SettingsProvider>
                </db.SignedIn>
                <db.SignedOut>
                    <SettingsProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <AppHeader />
                            <div className="flex flex-1 items-center justify-center p-8">
                                <p className="text-muted-foreground">
                                    Please sign in to continue
                                </p>
                            </div>
                        </SidebarInset>
                    </SettingsProvider>
                </db.SignedOut>
            </TimerSheetProvider>
        </SidebarProvider>
    );
}

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <GoogleOAuthProvider
            clientId={
                "941453914369-hhldcd1g9h24lt4mj0sc2rt62id1krmr.apps.googleusercontent.com"
            }
        >
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Toaster position="top-center" richColors />
                <AppShell />
                <TanStackRouterDevtools position="bottom-right" />
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}
