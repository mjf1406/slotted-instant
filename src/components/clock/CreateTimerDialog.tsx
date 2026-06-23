import { useEffect, useState } from "react";
import { id } from "@instantdb/react";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AudioCuesEditor } from "@/components/clock/AudioCuesEditor";
import { BgTransitionSelect } from "@/components/clock/BgTransitionSelect";
import { OptionalCollapsible } from "@/components/clock/OptionalCollapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorInput } from "@/components/ui/color-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DurationInput,
    durationToSeconds,
    secondsToDurationParts,
    type DurationUnit,
} from "@/components/ui/duration-input";
import { normalizeEndTime, secondsUntilEndTime } from "@/lib/timer-utils";
import { BG_TRANSITION_GLOBAL_VALUE } from "@/lib/bg-transitions";
import type { AudioCues } from "@/lib/audio-cues";
import { stripUndefinedAudioCues } from "@/lib/audio-cues";
import { createAudioUrlMap, useAudioPlayer } from "@/lib/audio-engine";
import { db } from "@/lib/db";
import type { Timer } from "@/lib/types";
import {
    getAllAudioOptions,
    toAudioUrlList,
    useAudioFiles,
    useTimers,
} from "@/hooks/use-clock-queries";

interface CreateTimerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timer?: Timer | null;
}

const NO_NEXT_TIMER = "__none__";

const defaultFormState = {
    name: "",
    duration: "5",
    durationUnit: "minutes" as DurationUnit,
    bgColor: "#15803d",
    useEndTime: false,
    endTime: "12:00:00",
    bgTransition: BG_TRANSITION_GLOBAL_VALUE,
    nextTimerId: NO_NEXT_TIMER,
    audioCues: {} as AudioCues,
};

export function CreateTimerDialog({
    open,
    onOpenChange,
    timer,
}: CreateTimerDialogProps) {
    const user = db.useUser();
    const { data: audioData } = useAudioFiles(user?.id);
    const { data: timersData } = useTimers(user?.id);
    const audioFiles = audioData?.audioFiles ?? [];
    const allTimers = timersData?.timers ?? [];
    const audioOptions = getAllAudioOptions(audioFiles);
    const urlMap = createAudioUrlMap(toAudioUrlList(audioFiles));
    const { preview } = useAudioPlayer(urlMap);

    const [name, setName] = useState(defaultFormState.name);
    const [duration, setDuration] = useState(defaultFormState.duration);
    const [durationUnit, setDurationUnit] = useState<DurationUnit>(
        defaultFormState.durationUnit
    );
    const [bgColor, setBgColor] = useState(defaultFormState.bgColor);
    const [useEndTime, setUseEndTime] = useState(defaultFormState.useEndTime);
    const [endTime, setEndTime] = useState(defaultFormState.endTime);
    const [bgTransition, setBgTransition] = useState(
        defaultFormState.bgTransition
    );
    const [nextTimerId, setNextTimerId] = useState(
        defaultFormState.nextTimerId
    );
    const [audioCues, setAudioCues] = useState<AudioCues>(
        defaultFormState.audioCues
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = timer != null;
    const nextTimerOptions = allTimers.filter(
        (candidate) => !isEditing || candidate.id !== timer?.id
    );

    useEffect(() => {
        if (!open) return;

        if (timer) {
            setName(timer.name);
            setBgColor(timer.bgColor);
            setBgTransition(timer.bgTransition ?? BG_TRANSITION_GLOBAL_VALUE);
            setNextTimerId(timer.nextTimer?.id ?? NO_NEXT_TIMER);
            setAudioCues((timer.audioCues as AudioCues) ?? {});
            if (timer.endTime) {
                setUseEndTime(true);
                setEndTime(normalizeEndTime(timer.endTime));
            } else {
                setUseEndTime(false);
                const parts = secondsToDurationParts(timer.durationSeconds);
                setDuration(parts.value);
                setDurationUnit(parts.unit);
            }
        } else {
            setName(defaultFormState.name);
            setDuration(defaultFormState.duration);
            setDurationUnit(defaultFormState.durationUnit);
            setBgColor(defaultFormState.bgColor);
            setUseEndTime(defaultFormState.useEndTime);
            setEndTime(defaultFormState.endTime);
            setBgTransition(defaultFormState.bgTransition);
            setNextTimerId(defaultFormState.nextTimerId);
            setAudioCues(defaultFormState.audioCues);
        }
    }, [open, timer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user?.id) return;

        setIsSubmitting(true);
        try {
            const durationSeconds = useEndTime
                ? secondsUntilEndTime(endTime)
                : durationToSeconds(duration, durationUnit);

            const timerId = isEditing ? timer.id : id();
            const updatePayload = {
                name: name.trim(),
                durationSeconds,
                bgColor,
                endTime: useEndTime ? endTime : undefined,
                bgTransition:
                    bgTransition === BG_TRANSITION_GLOBAL_VALUE
                        ? undefined
                        : bgTransition,
                audioCues: stripUndefinedAudioCues(audioCues),
            };

            const txs = [
                db.tx.timers[timerId].update(updatePayload),
            ];

            if (!isEditing) {
                txs[0] = db.tx.timers[timerId]
                    .update(updatePayload)
                    .link({ owner: user.id });
            }

            if (nextTimerId === NO_NEXT_TIMER) {
                // Clear chain by omitting link on update
            } else {
                txs.push(
                    db.tx.timers[timerId].link({ nextTimer: nextTimerId })
                );
            }

            await db.transact(txs);
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
                <form
                    onSubmit={(e) => void handleSubmit(e)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Edit Timer" : "Create Timer"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update this countdown timer."
                                : "Add a countdown timer for your classroom."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="timer-name">Name</Label>
                            <Input
                                id="timer-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Silent reading"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="use-end-time" className="flex-1">
                                Count down to a set end time
                            </Label>
                            <Switch
                                id="use-end-time"
                                checked={useEndTime}
                                onCheckedChange={setUseEndTime}
                            />
                        </div>

                        {useEndTime ? (
                            <div className="grid gap-2">
                                <Label htmlFor="end-time">End time</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    step={1}
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>Duration</Label>
                                <DurationInput
                                    value={duration}
                                    unit={durationUnit}
                                    onValueChange={setDuration}
                                    onUnitChange={setDurationUnit}
                                    min={0}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Background color</Label>
                            <ColorInput
                                value={bgColor}
                                onChange={setBgColor}
                            />
                        </div>

                        <BgTransitionSelect
                            id="timer-bg-transition"
                            label="Background color transition"
                            value={bgTransition}
                            onValueChange={setBgTransition}
                            showGlobalOption
                        />

                        <div className="grid gap-2">
                            <Label>Auto-play next</Label>
                            <Select
                                value={nextTimerId}
                                onValueChange={setNextTimerId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_NEXT_TIMER}>
                                        None
                                    </SelectItem>
                                    {nextTimerOptions.map((candidate) => (
                                        <SelectItem
                                            key={candidate.id}
                                            value={candidate.id}
                                        >
                                            {candidate.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <OptionalCollapsible title="Sounds">
                            <AudioCuesEditor
                                value={audioCues}
                                files={audioOptions}
                                allowInherit
                                onChange={setAudioCues}
                                onPreview={preview}
                            />
                        </OptionalCollapsible>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? isEditing
                                    ? "Saving..."
                                    : "Creating..."
                                : isEditing
                                  ? "Save Changes"
                                  : "Create Timer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
