import { NumberInput } from "./number-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";
import { cn } from "@/lib/utils";

export type DurationUnit = "seconds" | "minutes";

interface DurationInputProps {
    value: string;
    unit: DurationUnit;
    onValueChange: (value: string) => void;
    onUnitChange: (unit: DurationUnit) => void;
    min?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
}

function formatDecimalMinutes(minutes: number): string {
    const rounded = Math.round(minutes * 100) / 100;
    return String(rounded);
}

export function convertDurationUnit(
    value: string,
    from: DurationUnit,
    to: DurationUnit
): string {
    if (from === to) return value;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;

    if (from === "minutes" && to === "seconds") {
        return String(Math.round(numeric * 60));
    }

    return formatDecimalMinutes(numeric / 60);
}

export function durationToSeconds(value: string, unit: DurationUnit): number {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return unit === "minutes" ? Math.round(numeric * 60) : Math.round(numeric);
}

export function secondsToDurationParts(seconds: number): {
    value: string;
    unit: DurationUnit;
} {
    if (seconds >= 60) {
        return { value: formatDecimalMinutes(seconds / 60), unit: "minutes" };
    }
    return { value: String(seconds), unit: "seconds" };
}

export function DurationInput({
    value,
    unit,
    onValueChange,
    onUnitChange,
    min = 0,
    step,
    disabled,
    className,
}: DurationInputProps) {
    const displayStep = step ?? (unit === "minutes" ? 0.1 : 30);
    const displayMin = unit === "minutes" && min > 0 ? min / 60 : min;

    const handleUnitChange = (newUnit: DurationUnit) => {
        onValueChange(convertDurationUnit(value, unit, newUnit));
        onUnitChange(newUnit);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <NumberInput
                value={value}
                onChange={onValueChange}
                min={displayMin}
                step={displayStep}
                disabled={disabled}
                inputClassName="w-24 min-w-[96px]"
                className="flex-1"
            />
            <Select
                value={unit}
                onValueChange={(v) => handleUnitChange(v as DurationUnit)}
                disabled={disabled}
            >
                <SelectTrigger className="w-[7.5rem] shrink-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
