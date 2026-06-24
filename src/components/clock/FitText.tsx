import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFitFontSize } from "@/hooks/use-fit-font-size";

interface FitTextProps {
    benchmark: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export function FitText({
    benchmark,
    children,
    className,
    style,
}: FitTextProps) {
    const ref = useRef<HTMLDivElement>(null);
    const fontSize = useFitFontSize(ref, benchmark);

    return (
        <div
            ref={ref}
            className={cn("w-full text-center", className)}
            style={{ fontSize, ...style }}
        >
            {children}
        </div>
    );
}
