/** @format */

import { db } from "@/lib/db";
import { Clock } from "@/components/clock/Clock";
import { DEFAULT_CLOCK_SETTINGS } from "@/lib/clock-settings";
import type { AudioCues } from "@/lib/audio-cues";
import {
    DEFAULT_BG_TRANSITION,
    isBgTransition,
} from "@/lib/bg-transitions";
import type { TimerEndBehavior } from "@/lib/active-session";
import { useClockSettings } from "@/hooks/use-clock-queries";
import { useTimerSheet } from "@/lib/timer-sheet-context";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export function TimerSheet() {
    const { open, setOpen } = useTimerSheet();
    const user = db.useUser();
    const userId = user?.id;
    const { data: settingsData } = useClockSettings(userId);
    const settings = settingsData?.clockSettings?.[0];

    if (!userId) return null;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
                side="right"
                className="w-full gap-0 p-0 sm:max-w-xl"
            >
                <SheetHeader className="border-b px-4 py-3">
                    <SheetTitle>Display timer</SheetTitle>
                    <SheetDescription>
                        Control the classroom countdown. Press{" "}
                        <kbd className="rounded border px-1 text-xs">T</kbd> to
                        toggle this panel.
                    </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-hidden">
                    <Clock
                        userId={userId}
                        isRunner={false}
                        compact={false}
                        timeFormat={
                            settings?.timeFormat ??
                            DEFAULT_CLOCK_SETTINGS.timeFormat
                        }
                        clockSize={48}
                        dateSize={16}
                        dateLocation={
                            settings?.dateLocation ??
                            DEFAULT_CLOCK_SETTINGS.dateLocation
                        }
                        clockBgColor={
                            settings?.clockBgColor ??
                            DEFAULT_CLOCK_SETTINGS.clockBgColor
                        }
                        timerBgColor={
                            settings?.timerBgColor ??
                            DEFAULT_CLOCK_SETTINGS.timerBgColor
                        }
                        currentTimeSize={18}
                        endTimeSize={16}
                        timerTitleSize={16}
                        timerEndBehavior={
                            (settings?.timerEndBehavior ??
                                DEFAULT_CLOCK_SETTINGS.timerEndBehavior) as TimerEndBehavior
                        }
                        overtimeAutoDismissSeconds={
                            settings?.overtimeAutoDismissSeconds ??
                            DEFAULT_CLOCK_SETTINGS.overtimeAutoDismissSeconds
                        }
                        bgTransition={
                            isBgTransition(
                                settings?.bgTransition ??
                                    DEFAULT_CLOCK_SETTINGS.bgTransition
                            )
                                ? (settings?.bgTransition as typeof DEFAULT_BG_TRANSITION)
                                : DEFAULT_BG_TRANSITION
                        }
                        globalAudioCues={
                            (settings?.audioCues as AudioCues | undefined) ??
                            undefined
                        }
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
