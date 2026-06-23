import { useState } from "react";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DurationInput,
    durationToSeconds,
    type DurationUnit,
} from "@/components/ui/duration-input";
import { pushSlotClassToDisplay } from "@/lib/display-session";
import { db } from "@/lib/db";
import { toast } from "sonner";
import {
    getCurrentMinutesOfDay,
} from "@/lib/current-slot-class";
import { timeToMinutes } from "@/components/timetables/utils";

interface PushToDisplayDialogProps {
    slotClassId: string;
    slotEndTime?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "icon-sm";
}

function secondsUntilSlotEnd(slotEndTime: string): number {
    const endMinutes = timeToMinutes(slotEndTime);
    const nowMinutes = getCurrentMinutesOfDay();
    return Math.max(0, (endMinutes - nowMinutes) * 60);
}

export function PushToDisplayDialog({
    slotClassId,
    slotEndTime,
    open,
    onOpenChange,
}: PushToDisplayDialogProps) {
    const user = db.useUser();
    const [durationValue, setDurationValue] = useState("15");
    const [durationUnit, setDurationUnit] = useState<DurationUnit>("minutes");
    const [isPushing, setIsPushing] = useState(false);

    const applyPreset = (seconds: number) => {
        if (seconds >= 60 && seconds % 60 === 0) {
            setDurationValue(String(seconds / 60));
            setDurationUnit("minutes");
            return;
        }
        setDurationValue(String(seconds));
        setDurationUnit("seconds");
    };

    const handlePush = async () => {
        if (!user?.id) return;

        const durationSeconds = durationToSeconds(durationValue, durationUnit);
        if (durationSeconds <= 0) {
            toast.error("Choose a duration longer than zero");
            return;
        }

        setIsPushing(true);
        try {
            await pushSlotClassToDisplay(user.id, slotClassId, durationSeconds);
            toast.success("Pushed to classroom display");
            onOpenChange(false);
        } catch {
            toast.error("Failed to push to display");
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Push to display</DialogTitle>
                    <DialogDescription>
                        Override the auto-selected class for a set amount of
                        time. The display will return to the current timetable
                        slot when the timer ends.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Duration</p>
                        <DurationInput
                            value={durationValue}
                            unit={durationUnit}
                            onValueChange={setDurationValue}
                            onUnitChange={setDurationUnit}
                            min={1}
                            disabled={isPushing}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPushing}
                            onClick={() => applyPreset(5 * 60)}
                        >
                            5 min
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPushing}
                            onClick={() => applyPreset(15 * 60)}
                        >
                            15 min
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPushing}
                            onClick={() => applyPreset(30 * 60)}
                        >
                            30 min
                        </Button>
                        {slotEndTime ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPushing}
                                onClick={() =>
                                    applyPreset(secondsUntilSlotEnd(slotEndTime))
                                }
                            >
                                Rest of period
                            </Button>
                        ) : null}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPushing}
                    >
                        Cancel
                    </Button>
                    <Button onClick={() => void handlePush()} disabled={isPushing}>
                        {isPushing ? "Pushing..." : "Push to display"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface PushToDisplayButtonProps {
    slotClassId: string;
    slotEndTime?: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "icon-sm";
}

export function PushToDisplayButton({
    slotClassId,
    slotEndTime,
    variant = "outline",
    size = "sm",
}: PushToDisplayButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setOpen(true)}
            >
                <Monitor />
                Push to display
            </Button>
            <PushToDisplayDialog
                slotClassId={slotClassId}
                slotEndTime={slotEndTime}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
