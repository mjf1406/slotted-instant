import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BG_TRANSITION_GLOBAL_VALUE,
    BG_TRANSITION_OPTIONS,
} from "@/lib/bg-transitions";

interface BgTransitionSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    label?: string;
    showGlobalOption?: boolean;
    id?: string;
}

export function BgTransitionSelect({
    value,
    onValueChange,
    label = "Background transition",
    showGlobalOption = false,
    id,
}: BgTransitionSelectProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {showGlobalOption && (
                        <SelectItem value={BG_TRANSITION_GLOBAL_VALUE}>
                            Use global default
                        </SelectItem>
                    )}
                    {BG_TRANSITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
