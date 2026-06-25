/** @format */

"use client";

import { useEffect } from "react";
import { createRootRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
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
import {
    SidebarInset,
    SidebarProvider,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { db } from "@/lib/db";

function AppShellContent({ signedIn }: { signedIn: boolean }) {
    const matchRoute = useMatchRoute();
    const isDisplayRoute = !!matchRoute({ to: "/display", fuzzy: false });
    const { setOpen } = useSidebar();

    useEffect(() => {
        if (isDisplayRoute) {
            setOpen(false);
        }
    }, [isDisplayRoute, setOpen]);

    return (
        <>
            <AppSidebar />
            <SidebarInset
                className={cn(isDisplayRoute && "min-h-svh")}
            >
                {!isDisplayRoute && <AppHeader />}
                {signedIn ? (
                    <Outlet />
                ) : (
                    <div className="flex flex-1 items-center justify-center p-8">
                        <p className="text-muted-foreground">
                            Please sign in to continue
                        </p>
                    </div>
                )}
            </SidebarInset>
            {signedIn ? <TimerSheet /> : null}
        </>
    );
}

function AppShell() {
    return (
        <SidebarProvider>
            <ZoomDetector />
            <TimerSheetProvider>
                <db.SignedIn>
                    <SettingsProvider>
                        <TimetableProvider>
                            <AppShellContent signedIn />
                        </TimetableProvider>
                    </SettingsProvider>
                </db.SignedIn>
                <db.SignedOut>
                    <SettingsProvider>
                        <AppShellContent signedIn={false} />
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
                {import.meta.env.DEV && (
                    <TanStackRouterDevtools position="bottom-right" />
                )}
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}
