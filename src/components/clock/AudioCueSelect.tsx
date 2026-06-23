import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CueRef } from "@/lib/audio-cues";

export type AudioFileOption = {
    id: string;
    name: string;
    isBuiltin?: boolean;
};

export type CueSelectValue = "inherit" | "none" | string;

interface AudioCueSelectProps {
    label: string;
    value: CueSelectValue;
    audioId?: CueRef;
    files: AudioFileOption[];
    allowInherit?: boolean;
    onChange: (value: CueSelectValue, audioId?: CueRef) => void;
    onPreview?: (audioId: string) => void;
}

export function audioIdToSelectValue(
    audioId: CueRef | undefined,
    allowInherit: boolean
): CueSelectValue {
    if (audioId === undefined) return allowInherit ? "inherit" : "none";
    if (audioId === "none") return "none";
    return audioId;
}

export function selectValueToAudioId(
    value: CueSelectValue
): CueRef | undefined {
    if (value === "inherit") return undefined;
    if (value === "none") return "none";
    return value;
}

export function AudioCueSelect({
    label,
    value,
    files,
    allowInherit = false,
    onChange,
    onPreview,
}: AudioCueSelectProps) {
    const previewId = value !== "inherit" && value !== "none" ? value : null;

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Select
                    value={value}
                    onValueChange={(next) => {
                        onChange(
                            next as CueSelectValue,
                            selectValueToAudioId(next as CueSelectValue)
                        );
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {allowInherit && (
                            <SelectItem value="inherit">Use default</SelectItem>
                        )}
                        <SelectItem value="none">None (silent)</SelectItem>
                        {files.map((file) => (
                            <SelectItem key={file.id} value={file.id}>
                                {file.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {previewId && onPreview && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => onPreview(previewId)}
                        aria-label={`Preview ${label}`}
                    >
                        <Play />
                    </Button>
                )}
            </div>
        </div>
    );
}
