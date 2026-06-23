/** @format */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useBrowserZoom } from "@/hooks/useBrowserZoom";

const TOAST_DURATION_MS = 6000;

export function ZoomDetector() {
    const navigate = useNavigate();
    const isToastVisibleRef = useRef(false);
    const toastTimeoutRef = useRef<number | null>(null);

    const showToastRef = useRef<((zoomLevel?: number) => void) | undefined>(
        undefined
    );

    showToastRef.current = (zoomLevel?: number) => {
        if (isToastVisibleRef.current) {
            return;
        }

        isToastVisibleRef.current = true;

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
                <button
                    type="button"
                    className="text-left text-sm font-medium text-primary underline hover:opacity-80"
                    onClick={() => {
                        void navigate({ to: "/settings" });
                    }}
                >
                    Go to Settings →
                </button>
            </div>,
            {
                position: "top-center",
                duration: TOAST_DURATION_MS,
            }
        );

        toastTimeoutRef.current = window.setTimeout(() => {
            isToastVisibleRef.current = false;
            toastTimeoutRef.current = null;
        }, TOAST_DURATION_MS);
    };

    const handleZoomChange = useCallback((zoomLevel: number) => {
        if (Math.abs(zoomLevel - 1.0) > 0.01) {
            showToastRef.current?.(zoomLevel);
        }
    }, []);

    const handleZoomShortcut = useCallback(() => {
        showToastRef.current?.();
    }, []);

    useBrowserZoom(handleZoomChange, handleZoomShortcut);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    return null;
}
