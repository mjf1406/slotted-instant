/** @format */

import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { ThemeProviderContext } from "@/components/_themes/theme-context";

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme } = useContext(ThemeProviderContext);
    const [sonnerTheme, setSonnerTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        const getTheme = () => {
            if (theme === "system") {
                return window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light";
            }
            return theme;
        };

        setSonnerTheme(getTheme());

        if (theme === "system") {
            const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)"
            );
            const handleChange = () => setSonnerTheme(getTheme());
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme]);

    return (
        <Sonner
            theme={sonnerTheme as ToasterProps["theme"]}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

export { Toaster };
