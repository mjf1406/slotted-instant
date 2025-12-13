/** @format */

import { useEffect, useRef } from "react";

/**
 * Hook to detect browser zoom changes via keyboard shortcuts or mouse wheel
 * @param onZoomChange - Callback function called when zoom level changes, receives the new zoom level
 * @param onZoomShortcut - Optional callback function called immediately when zoom shortcut is detected
 */
export function useBrowserZoom(
    onZoomChange: (zoomLevel: number) => void,
    onZoomShortcut?: () => void
) {
    const lastZoomLevelRef = useRef<number>(1.0);
    const testElementRef = useRef<HTMLDivElement | null>(null);
    // Use refs to store callbacks to avoid re-running effect when callbacks change
    const onZoomChangeRef = useRef(onZoomChange);
    const onZoomShortcutRef = useRef(onZoomShortcut);

    // Update refs when callbacks change
    useEffect(() => {
        onZoomChangeRef.current = onZoomChange;
        onZoomShortcutRef.current = onZoomShortcut;
    }, [onZoomChange, onZoomShortcut]);

    useEffect(() => {
        // Create a test element to measure actual zoom
        // This is the most reliable method for detecting browser zoom
        const createTestElement = (): HTMLDivElement => {
            const testDiv = document.createElement("div");
            testDiv.style.cssText = `
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: 100px;
                height: 100px;
                overflow: hidden;
                visibility: hidden;
            `;
            document.body.appendChild(testDiv);
            return testDiv;
        };

        // Clean up test element
        const cleanupTestElement = (element: HTMLDivElement | null) => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        };

        // Function to get current zoom level using multiple methods
        const getZoomLevel = (): number => {
            // Method 1: Use test element to measure actual rendered size
            if (!testElementRef.current) {
                testElementRef.current = createTestElement();
            }

            const testElement = testElementRef.current;
            const rect = testElement.getBoundingClientRect();
            const actualWidth = rect.width;
            const expectedWidth = 100; // We set width to 100px

            // The zoom level is the ratio
            let zoom = actualWidth / expectedWidth;

            // Method 2: Use screen dimensions as a cross-check
            const screenWidth = window.screen.width;
            const windowWidth = window.innerWidth;
            const devicePixelRatio = window.devicePixelRatio || 1;

            // Calculate expected window width at 100% zoom
            // This accounts for device pixel ratio
            const expectedWindowWidth = screenWidth / devicePixelRatio;

            if (expectedWindowWidth > 0) {
                const screenBasedZoom = windowWidth / expectedWindowWidth;
                // If both methods give similar results, use the average
                // Otherwise, prefer the test element method
                if (!isNaN(screenBasedZoom) && isFinite(screenBasedZoom)) {
                    if (Math.abs(zoom - screenBasedZoom) < 0.2) {
                        zoom = (zoom + screenBasedZoom) / 2;
                    } else {
                        // If they differ significantly, prefer test element
                        // but validate it's reasonable
                        if (
                            isNaN(zoom) ||
                            !isFinite(zoom) ||
                            zoom < 0.1 ||
                            zoom > 10
                        ) {
                            zoom = screenBasedZoom;
                        }
                    }
                }
            }

            // Clamp to reasonable values (0.25x to 5x)
            zoom = Math.max(0.25, Math.min(5, zoom));

            return zoom;
        };

        // Check for zoom changes
        const checkZoomChange = () => {
            const currentZoom = getZoomLevel();
            // Trigger if:
            // 1. Zoom has changed significantly (more than 5%)
            // 2. OR if current zoom is significantly different from 1.0 and we were at 1.0
            const hasChanged =
                Math.abs(currentZoom - lastZoomLevelRef.current) > 0.05;
            const isNotNormal = Math.abs(currentZoom - 1.0) > 0.05;
            const wasNormal = Math.abs(lastZoomLevelRef.current - 1.0) < 0.05;

            if (hasChanged || (isNotNormal && wasNormal)) {
                lastZoomLevelRef.current = currentZoom;
                // Always call the callback if zoom is not 1.0, even if it hasn't "changed"
                // This ensures we catch zoom states that were already present
                if (isNotNormal) {
                    onZoomChangeRef.current(currentZoom);
                }
            }
        };

        // Handle keyboard shortcuts (Ctrl/Cmd + -/+ or 0)
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for zoom shortcuts - be more permissive with key detection
            const isZoomShortcut =
                (e.ctrlKey || e.metaKey) &&
                (e.key === "-" ||
                    e.key === "=" ||
                    e.key === "+" ||
                    e.key === "0" ||
                    e.code === "Minus" ||
                    e.code === "Equal" ||
                    e.code === "NumpadSubtract" ||
                    e.code === "NumpadAdd" ||
                    e.code === "NumpadEqual" ||
                    e.code === "Digit0");

            if (isZoomShortcut) {
                // Immediately trigger the shortcut callback if provided
                if (onZoomShortcutRef.current) {
                    onZoomShortcutRef.current();
                }

                // When zoom shortcut is detected, always check for zoom changes
                // Use multiple checks with increasing delays to catch the zoom change
                // Browser zoom takes time to apply
                [100, 200, 300, 400, 500, 600, 800, 1000].forEach((delay) => {
                    setTimeout(() => {
                        checkZoomChange();
                    }, delay);
                });
            }
        };

        // Handle mouse wheel with Ctrl/Cmd key
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Check zoom after wheel event
                [200, 400, 600].forEach((delay) => {
                    setTimeout(() => {
                        checkZoomChange();
                    }, delay);
                });
            }
        };

        // Listen for visualViewport resize events
        const handleVisualViewportResize = () => {
            setTimeout(() => {
                checkZoomChange();
            }, 100);
        };

        // Listen for window resize (zoom changes can trigger this)
        const handleResize = () => {
            setTimeout(() => {
                checkZoomChange();
            }, 100);
        };

        // Initialize zoom level
        lastZoomLevelRef.current = getZoomLevel();

        // Add event listeners
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("wheel", handleWheel, { passive: true });
        window.addEventListener("resize", handleResize);

        if (window.visualViewport) {
            window.visualViewport.addEventListener(
                "resize",
                handleVisualViewportResize
            );
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("resize", handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener(
                    "resize",
                    handleVisualViewportResize
                );
            }
            cleanupTestElement(testElementRef.current);
            testElementRef.current = null;
        };
    }, []); // Empty dependency array - callbacks are accessed via refs
}
