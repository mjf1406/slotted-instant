import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
    Maximize,
    Minimize,
    PanelLeft,
    PanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { Clock } from "@/components/clock/Clock";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClassDetailsDisplayMode from "@/components/timetables/class-details/ClassDetailsDisplayMode";
import ClassDetailsHeader from "@/components/timetables/class-details/ClassDetailsHeader";
import { DEFAULT_CLOCK_SETTINGS } from "@/lib/clock-settings";
import type { AudioCues } from "@/lib/audio-cues";
import {
    DEFAULT_BG_TRANSITION,
    isBgTransition,
} from "@/lib/bg-transitions";
import type { TimerEndBehavior } from "@/lib/active-session";
import { useClockSettings, useDisplaySession } from "@/hooks/use-clock-queries";
import { createAudioUrlMap, useAudioPlayer } from "@/lib/audio-engine";
import { toAudioUrlList, useAudioFiles } from "@/hooks/use-clock-queries";
import { getLastTimetableId } from "@/lib/last-timetable";
import { resolveCurrentSlotClass, isEarlyPreviewSlot, minutesUntilSlotStart } from "@/lib/current-slot-class";
import {
    clearPushedSlotClass,
    formatPushOverrideRemaining,
    isPushOverrideActive,
} from "@/lib/display-session";

type SplitOrientation = "horizontal" | "vertical";

const displayRoute = getRouteApi("/display");

export function DisplayPage() {
    const { timetableId: searchTimetableId } = displayRoute.useSearch();
    const user = db.useUser();
    const userId = user?.id;
    const containerRef = useRef<HTMLDivElement>(null);
    const clearedPushRef = useRef(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [orientation, setOrientation] =
        useState<SplitOrientation>("horizontal");
    const [splitRatio, setSplitRatio] = useState(45);
    const [now, setNow] = useState(() => new Date());

    const timetableId = searchTimetableId ?? getLastTimetableId();

    const { data: settingsData } = useClockSettings(userId);
    const { data: displayData } = useDisplaySession(userId);
    const { data: audioData } = useAudioFiles(userId);
    const { data: timetableData } = db.useQuery(
        userId && timetableId
            ? {
                  timetables: {
                      $: {
                          where: { id: { $in: [timetableId] } },
                      },
                      slots: {},
                      slotClasses: {
                          class: {},
                          slot: {},
                      },
                  },
              }
            : {}
    );

    const settings = settingsData?.clockSettings?.[0];
    const displaySession = displayData?.displaySessions?.[0];
    const pushedSlotClass = displaySession?.pushedSlotClass;
    const pushedUntil = displaySession?.pushedUntil;
    const timetable = timetableData?.timetables?.[0];

    const autoSlotClass = useMemo(() => {
        if (!timetable) return null;
        return resolveCurrentSlotClass(
            timetable.slots ?? [],
            timetable.slotClasses ?? [],
            now
        );
    }, [now, timetable]);

    const pushActive =
        !!pushedSlotClass &&
        isPushOverrideActive(pushedUntil, now.getTime());

    const activeSlotClass = pushActive ? pushedSlotClass : autoSlotClass;

    const autoSlotLike = useMemo(() => {
        const slot = autoSlotClass?.slot;
        if (!slot?.id || !slot.startTime || !slot.endTime || !slot.day) {
            return null;
        }
        return {
            id: slot.id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
        };
    }, [autoSlotClass?.slot]);

    const urlMap = createAudioUrlMap(toAudioUrlList(audioData?.audioFiles ?? []));
    const { unlock } = useAudioPlayer(urlMap);

    useEffect(() => {
        unlock();
    }, [unlock]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(new Date());
        }, 60_000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!userId || !pushedSlotClass) {
            clearedPushRef.current = false;
            return;
        }

        if (isPushOverrideActive(pushedUntil, now.getTime())) {
            clearedPushRef.current = false;
            return;
        }

        if (clearedPushRef.current) return;

        clearedPushRef.current = true;
        void clearPushedSlotClass(userId);
    }, [userId, pushedSlotClass, pushedUntil, now]);

    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    if (!userId) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <p className="text-muted-foreground">
                    Please sign in to use the display.
                </p>
            </div>
        );
    }

    const clockProps = {
        userId,
        isRunner: true,
        compact: true,
        showTimeAdjust: true,
        fillWidth: true,
        timeFormat: settings?.timeFormat ?? DEFAULT_CLOCK_SETTINGS.timeFormat,
        clockSize: settings?.clockSize ?? DEFAULT_CLOCK_SETTINGS.clockSize,
        dateSize: settings?.dateSize ?? DEFAULT_CLOCK_SETTINGS.dateSize,
        dateLocation:
            settings?.dateLocation ?? DEFAULT_CLOCK_SETTINGS.dateLocation,
        clockBgColor:
            settings?.clockBgColor ?? DEFAULT_CLOCK_SETTINGS.clockBgColor,
        timerBgColor:
            settings?.timerBgColor ?? DEFAULT_CLOCK_SETTINGS.timerBgColor,
        currentTimeSize:
            settings?.currentTimeSize ?? DEFAULT_CLOCK_SETTINGS.currentTimeSize,
        endTimeSize: settings?.endTimeSize ?? DEFAULT_CLOCK_SETTINGS.endTimeSize,
        timerTitleSize:
            settings?.timerTitleSize ?? DEFAULT_CLOCK_SETTINGS.timerTitleSize,
        timerEndBehavior: (settings?.timerEndBehavior ??
            DEFAULT_CLOCK_SETTINGS.timerEndBehavior) as TimerEndBehavior,
        overtimeAutoDismissSeconds:
            settings?.overtimeAutoDismissSeconds ??
            DEFAULT_CLOCK_SETTINGS.overtimeAutoDismissSeconds,
        bgTransition: isBgTransition(
            settings?.bgTransition ?? DEFAULT_CLOCK_SETTINGS.bgTransition
        )
            ? (settings?.bgTransition as typeof DEFAULT_BG_TRANSITION)
            : DEFAULT_BG_TRANSITION,
        globalAudioCues: (settings?.audioCues as AudioCues | undefined) ?? undefined,
    };

    const displayText =
        activeSlotClass?.text ||
        activeSlotClass?.class?.defaultText ||
        "";
    const classDetails = activeSlotClass?.class;
    const formattedDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const statusLabel = pushActive
        ? `Showing pushed class (${formatPushOverrideRemaining(pushedUntil!, now.getTime())})`
        : autoSlotClass && autoSlotLike
          ? isEarlyPreviewSlot(autoSlotLike, now)
              ? `Showing upcoming class (starts in ${minutesUntilSlotStart(autoSlotLike, now)} min)`
              : "Showing current class"
          : null;

    const contentFontSize =
        settings?.displayContentFontSize ??
        DEFAULT_CLOCK_SETTINGS.displayContentFontSize;
    const headingFontSize =
        settings?.displayHeadingFontSize ??
        DEFAULT_CLOCK_SETTINGS.displayHeadingFontSize;

    return (
        <div
            ref={containerRef}
            className="relative flex h-full min-h-0 w-full flex-col bg-background"
        >
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            setOrientation((o) =>
                                o === "horizontal" ? "vertical" : "horizontal"
                            )
                        }
                        title="Flip split"
                        aria-label="Flip split"
                    >
                        {orientation === "horizontal" ? (
                            <PanelTop />
                        ) : (
                            <PanelLeft />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void toggleFullscreen()}
                        title={
                            isFullscreen ? "Exit fullscreen" : "Fullscreen"
                        }
                        aria-label={
                            isFullscreen ? "Exit fullscreen" : "Fullscreen"
                        }
                    >
                        {isFullscreen ? <Minimize /> : <Maximize />}
                    </Button>
                </div>
                {statusLabel ? (
                    <span className="text-xs text-muted-foreground">
                        {statusLabel}
                    </span>
                ) : null}
            </div>

            <div
                className={cn(
                    "flex min-h-0 flex-1",
                    orientation === "horizontal" ? "flex-row" : "flex-col"
                )}
            >
                <div
                    className="min-h-0 min-w-0 overflow-hidden"
                    style={{
                        [orientation === "horizontal" ? "width" : "height"]:
                            `${splitRatio}%`,
                    }}
                >
                    <Clock {...clockProps} />
                </div>
                <div
                    className="w-2 shrink-0 cursor-col-resize bg-border hover:bg-primary/30"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const start = orientation === "horizontal" ? e.clientX : e.clientY;
                        const startRatio = splitRatio;
                        const onMove = (ev: MouseEvent) => {
                            const container = containerRef.current;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const total =
                                orientation === "horizontal"
                                    ? rect.width
                                    : rect.height;
                            const delta =
                                (orientation === "horizontal"
                                    ? ev.clientX
                                    : ev.clientY) - start;
                            const next = Math.min(
                                75,
                                Math.max(
                                    25,
                                    startRatio + (delta / total) * 100
                                )
                            );
                            setSplitRatio(next);
                        };
                        const onUp = () => {
                            window.removeEventListener("mousemove", onMove);
                            window.removeEventListener("mouseup", onUp);
                        };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                    }}
                />
                <div className="min-h-0 min-w-0 flex-1 overflow-hidden border-l">
                    <div className="flex h-full flex-col">
                        {classDetails ? (
                            <>
                                <ClassDetailsHeader
                                    classDetails={classDetails}
                                    formattedDate={formattedDate}
                                    isComplete={activeSlotClass?.complete ?? false}
                                    isEditMode={false}
                                    onEditClick={() => {}}
                                    onClose={() => {}}
                                    showEditButton={false}
                                    showShortcuts={false}
                                />
                                <ScrollArea className="grow p-6">
                                    <ClassDetailsDisplayMode
                                        displayText={displayText}
                                        contentFontSize={contentFontSize}
                                        headingFontSize={headingFontSize}
                                    />
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <p className="text-lg font-medium">
                                    No class scheduled right now
                                </p>
                                <p className="mt-2 max-w-sm text-sm">
                                    The display will update automatically up to
                                    3 minutes before the next class starts, or
                                    you can push a class from your timetable.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
