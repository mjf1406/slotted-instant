/** @format */

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

type TimerSheetContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
    toggle: () => void;
};

const TimerSheetContext = createContext<TimerSheetContextValue | null>(null);

export function TimerSheetProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);

    const toggle = useCallback(() => {
        setOpen((prev) => !prev);
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key.toLowerCase() !== "t" ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            ) {
                return;
            }

            const target = event.target;
            if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT")
            ) {
                return;
            }

            event.preventDefault();
            toggle();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [toggle]);

    const value = useMemo(
        () => ({ open, setOpen, toggle }),
        [open, toggle]
    );

    return (
        <TimerSheetContext.Provider value={value}>
            {children}
        </TimerSheetContext.Provider>
    );
}

export function useTimerSheet() {
    const context = useContext(TimerSheetContext);
    if (!context) {
        throw new Error("useTimerSheet must be used within TimerSheetProvider");
    }
    return context;
}
