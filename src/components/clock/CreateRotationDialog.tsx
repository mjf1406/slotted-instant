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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { ColorInput } from "@/components/ui/color-input";
import { Switch } from "@/components/ui/switch";
import {
    DurationInput,
    durationToSeconds,
    secondsToDurationParts,
    type DurationUnit,
} from "@/components/ui/duration-input";
import { AudioCuesEditor } from "@/components/clock/AudioCuesEditor";
import { BgTransitionSelect } from "@/components/clock/BgTransitionSelect";
import { OptionalCollapsible } from "@/components/clock/OptionalCollapsible";
import { BG_TRANSITION_GLOBAL_VALUE } from "@/lib/bg-transitions";
import type { AudioCues } from "@/lib/audio-cues";
import { stripUndefinedAudioCues } from "@/lib/audio-cues";
import { createAudioUrlMap, useAudioPlayer } from "@/lib/audio-engine";
import { db } from "@/lib/db";
import type { Rotation } from "@/lib/types";
import {
    getAllAudioOptions,
    toAudioUrlList,
    useAudioFiles,
} from "@/hooks/use-clock-queries";

interface CreateRotationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rotation?: Rotation | null;
}

const defaultFormState = {
    name: "",
    rotationDuration: "5",
    rotationDurationUnit: "minutes" as DurationUnit,
    numberOfRotations: "4",
    transitionDuration: "30",
    transitionDurationUnit: "seconds" as DurationUnit,
    rotationsBgColor: "#1e40af",
    transitionBgColor: "#6b7280",
    finalTransition: false,
    bgTransition: BG_TRANSITION_GLOBAL_VALUE,
    audioCues: {} as AudioCues,
    workCues: {} as AudioCues,
    transitionCues: {} as AudioCues,
};

export function CreateRotationDialog({
    open,
    onOpenChange,
    rotation,
}: CreateRotationDialogProps) {
    const user = db.useUser();
    const { data: audioData } = useAudioFiles(user?.id);
    const audioFiles = audioData?.audioFiles ?? [];
    const audioOptions = getAllAudioOptions(audioFiles);
    const urlMap = createAudioUrlMap(toAudioUrlList(audioFiles));
    const { preview } = useAudioPlayer(urlMap);

    const [name, setName] = useState(defaultFormState.name);
    const [rotationDuration, setRotationDuration] = useState(
        defaultFormState.rotationDuration
    );
    const [rotationDurationUnit, setRotationDurationUnit] =
        useState<DurationUnit>(defaultFormState.rotationDurationUnit);
    const [numberOfRotations, setNumberOfRotations] = useState(
        defaultFormState.numberOfRotations
    );
    const [transitionDuration, setTransitionDuration] = useState(
        defaultFormState.transitionDuration
    );
    const [transitionDurationUnit, setTransitionDurationUnit] =
        useState<DurationUnit>(defaultFormState.transitionDurationUnit);
    const [rotationsBgColor, setRotationsBgColor] = useState(
        defaultFormState.rotationsBgColor
    );
    const [transitionBgColor, setTransitionBgColor] = useState(
        defaultFormState.transitionBgColor
    );
    const [finalTransition, setFinalTransition] = useState(
        defaultFormState.finalTransition
    );
    const [bgTransition, setBgTransition] = useState(
        defaultFormState.bgTransition
    );
    const [audioCues, setAudioCues] = useState<AudioCues>(
        defaultFormState.audioCues
    );
    const [workCues, setWorkCues] = useState<AudioCues>(
        defaultFormState.workCues
    );
    const [transitionCues, setTransitionCues] = useState<AudioCues>(
        defaultFormState.transitionCues
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = rotation != null;

    useEffect(() => {
        if (!open) return;

        if (rotation) {
            setName(rotation.name);
            setNumberOfRotations(String(rotation.numberOfRotations));
            setRotationsBgColor(rotation.rotationsBgColor);
            setTransitionBgColor(rotation.transitionBgColor);
            setFinalTransition(rotation.finalTransition ?? false);
            setBgTransition(rotation.bgTransition ?? BG_TRANSITION_GLOBAL_VALUE);
            setAudioCues((rotation.audioCues as AudioCues) ?? {});
            setWorkCues((rotation.workCues as AudioCues) ?? {});
            setTransitionCues((rotation.transitionCues as AudioCues) ?? {});

            const rotationParts = secondsToDurationParts(
                rotation.rotationsDurationSeconds
            );
            setRotationDuration(rotationParts.value);
            setRotationDurationUnit(rotationParts.unit);

            const transitionParts = secondsToDurationParts(
                Number(rotation.transitionDuration)
            );
            setTransitionDuration(transitionParts.value);
            setTransitionDurationUnit(transitionParts.unit);
        } else {
            setName(defaultFormState.name);
            setRotationDuration(defaultFormState.rotationDuration);
            setRotationDurationUnit(defaultFormState.rotationDurationUnit);
            setNumberOfRotations(defaultFormState.numberOfRotations);
            setTransitionDuration(defaultFormState.transitionDuration);
            setTransitionDurationUnit(defaultFormState.transitionDurationUnit);
            setRotationsBgColor(defaultFormState.rotationsBgColor);
            setTransitionBgColor(defaultFormState.transitionBgColor);
            setFinalTransition(defaultFormState.finalTransition);
            setBgTransition(defaultFormState.bgTransition);
            setAudioCues(defaultFormState.audioCues);
            setWorkCues(defaultFormState.workCues);
            setTransitionCues(defaultFormState.transitionCues);
        }
    }, [open, rotation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user?.id) return;

        setIsSubmitting(true);
        try {
            const rotationId = isEditing ? rotation.id : id();
            const payload = {
                name: name.trim(),
                rotationsDurationSeconds: durationToSeconds(
                    rotationDuration,
                    rotationDurationUnit
                ),
                numberOfRotations: Number(numberOfRotations),
                transitionDuration: String(
                    durationToSeconds(
                        transitionDuration,
                        transitionDurationUnit
                    )
                ),
                rotationsBgColor,
                transitionBgColor,
                finalTransition,
                bgTransition:
                    bgTransition === BG_TRANSITION_GLOBAL_VALUE
                        ? undefined
                        : bgTransition,
                audioCues: stripUndefinedAudioCues(audioCues),
                workCues: stripUndefinedAudioCues(workCues),
                transitionCues: stripUndefinedAudioCues(transitionCues),
            };

            if (isEditing) {
                await db.transact(db.tx.rotations[rotationId].update(payload));
            } else {
                await db.transact(
                    db.tx.rotations[rotationId]
                        .update(payload)
                        .link({ owner: user.id })
                );
            }

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
                            {isEditing ? "Edit Rotation" : "Create Rotation"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update this rotation schedule."
                                : "Set up a rotation schedule for your classroom."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rotation-name">Name</Label>
                            <Input
                                id="rotation-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Centers rotation"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Rotation duration</Label>
                            <DurationInput
                                value={rotationDuration}
                                unit={rotationDurationUnit}
                                onValueChange={setRotationDuration}
                                onUnitChange={setRotationDurationUnit}
                                min={0}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Number of rotations</Label>
                            <NumberInput
                                value={numberOfRotations}
                                onChange={setNumberOfRotations}
                                min={1}
                                step={1}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Transition duration</Label>
                            <DurationInput
                                value={transitionDuration}
                                unit={transitionDurationUnit}
                                onValueChange={setTransitionDuration}
                                onUnitChange={setTransitionDurationUnit}
                                min={0}
                                step={
                                    transitionDurationUnit === "minutes"
                                        ? 0.1
                                        : 5
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Rotation background color</Label>
                            <ColorInput
                                value={rotationsBgColor}
                                onChange={setRotationsBgColor}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Transition background color</Label>
                            <ColorInput
                                value={transitionBgColor}
                                onChange={setTransitionBgColor}
                            />
                        </div>

                        <OptionalCollapsible title="Advanced options">
                            <div className="flex items-center justify-between gap-4">
                                <Label htmlFor="final-transition" className="flex-1">
                                    Add a transition after the final rotation
                                </Label>
                                <Switch
                                    id="final-transition"
                                    checked={finalTransition}
                                    onCheckedChange={setFinalTransition}
                                />
                            </div>

                            <BgTransitionSelect
                                id="rotation-bg-transition"
                                label="Background color transition"
                                value={bgTransition}
                                onValueChange={setBgTransition}
                                showGlobalOption
                            />
                        </OptionalCollapsible>

                        <OptionalCollapsible title="Sounds">
                            <AudioCuesEditor
                                value={audioCues}
                                files={audioOptions}
                                allowInherit
                                onChange={setAudioCues}
                                onPreview={preview}
                            />
                            <AudioCuesEditor
                                value={workCues}
                                files={audioOptions}
                                allowInherit
                                onChange={setWorkCues}
                                onPreview={preview}
                            />
                            <AudioCuesEditor
                                value={transitionCues}
                                files={audioOptions}
                                allowInherit
                                onChange={setTransitionCues}
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
                                  : "Create Rotation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
