import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Maximize, Minimize, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { Clock } from "@/components/clock/Clock";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClassDetailsDisplayMode from "@/components/timetables/class-details/ClassDetailsDisplayMode";
import ClassDetailsHeader from "@/components/timetables/class-details/ClassDetailsHeader";
import { DEFAULT_CLOCK_SETTINGS, DEFAULT_QUICK_TEXT_TITLE } from "@/lib/clock-settings";
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
import {
    resolveCurrentSlotClass,
    findCurrentSlot,
    isEarlyPreviewSlot,
    minutesUntilSlotStart,
} from "@/lib/current-slot-class";
import {
    clearPushedSlotClass,
    formatPushOverrideRemaining,
    isPushOverrideActive,
} from "@/lib/display-session";
import { clearQuickText } from "@/lib/quick-text";

type DisplayLayout = "clockOnly" | "classOnly" | "vertical" | "horizontal";

const displayRoute = getRouteApi("/display");

export function DisplayPage() {
    const { timetableId: searchTimetableId } = displayRoute.useSearch();
    const user = db.useUser();
    const userId = user?.id;
    const containerRef = useRef<HTMLDivElement>(null);
    const clearedPushRef = useRef(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [layout, setLayout] = useState<DisplayLayout>("horizontal");
    const [splitRatio, setSplitRatio] = useState(45);
    const [now, setNow] = useState(() => new Date());
    const [isClearingQuickText, setIsClearingQuickText] = useState(false);

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
    const showClassContent = !!activeSlotClass?.class;
    const globalQuickText =
        !pushActive && !showClassContent ? settings?.quickText : null;

    const currentSlot = useMemo(() => {
        if (!timetable) return null;
        return findCurrentSlot(timetable.slots ?? [], now);
    }, [now, timetable]);

    const autoSlotLike = useMemo(() => {
        const slot = activeSlotClass?.slot ?? currentSlot;
        if (!slot?.id || !slot.startTime || !slot.endTime || !slot.day) {
            return null;
        }
        return {
            id: slot.id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
        };
    }, [activeSlotClass?.slot, currentSlot]);

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

    const handleClearQuickText = useCallback(async () => {
        const settingsId = settings?.id;
        if (!settingsId || isClearingQuickText) return;

        setIsClearingQuickText(true);
        try {
            await clearQuickText(settingsId);
            toast.success("Quick text cleared");
        } catch (error) {
            console.error("Failed to clear quick text:", error);
            toast.error("Failed to clear quick text");
        } finally {
            setIsClearingQuickText(false);
        }
    }, [settings?.id, isClearingQuickText]);

    const beginSplitResize = useCallback(
        (startX: number, startY: number) => {
            const isHorizontal = layout === "horizontal";
            const start = isHorizontal ? startX : startY;
            const startRatio = splitRatio;

            const onMove = (ev: PointerEvent) => {
                const container = containerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const total = isHorizontal ? rect.width : rect.height;
                const current = isHorizontal ? ev.clientX : ev.clientY;
                const next = Math.min(
                    75,
                    Math.max(
                        25,
                        startRatio + ((current - start) / total) * 100
                    )
                );
                setSplitRatio(next);
            };

            const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
            };

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        },
        [layout, splitRatio]
    );

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

    const displayText = showClassContent
        ? activeSlotClass?.text ||
          activeSlotClass?.class?.defaultText ||
          ""
        : globalQuickText || "";
    const classDetails = showClassContent ? activeSlotClass?.class : null;
    const formattedDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const statusLabel = pushActive
        ? `Showing pushed class (${formatPushOverrideRemaining(pushedUntil!, now.getTime())})`
        : showClassContent && autoSlotLike
          ? isEarlyPreviewSlot(autoSlotLike, now)
              ? `Showing upcoming class (starts in ${minutesUntilSlotStart(autoSlotLike, now)} min)`
              : "Showing current class"
          : globalQuickText
            ? "Showing quick text"
            : null;

    const globalQuickTextTitle =
        settings?.quickTextTitle?.trim() || DEFAULT_QUICK_TEXT_TITLE;
    const contentFontSize =
        settings?.displayContentFontSize ??
        DEFAULT_CLOCK_SETTINGS.displayContentFontSize;
    const headingFontSize =
        settings?.displayHeadingFontSize ??
        DEFAULT_CLOCK_SETTINGS.displayHeadingFontSize;

    const clockPanel = (
        <div className="min-h-0 min-w-0 h-full w-full overflow-hidden">
            <Clock {...clockProps} />
        </div>
    );

    const classPanel = (
        <div
            className={cn(
                "min-h-0 min-w-0 h-full w-full flex-1 overflow-hidden",
                layout === "horizontal" && "border-l",
                layout === "vertical" && "border-t"
            )}
        >
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
                ) : globalQuickText ? (
                    <>
                        <div className="flex items-center justify-between border-b bg-muted/50 p-6">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">
                                    {globalQuickTextTitle}
                                </h2>
                                <p className="text-muted-foreground">
                                    {formattedDate}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => void handleClearQuickText()}
                                disabled={isClearingQuickText}
                                title="Clear quick text"
                                aria-label="Clear quick text"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
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
                            The display will update automatically up to 3
                            minutes before the next class starts, or you can
                            push a class from your timetable.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const splitDivider = (
        <div
            className={cn(
                "relative shrink-0 touch-none",
                layout === "horizontal"
                    ? "flex w-8 cursor-col-resize items-stretch justify-center"
                    : "flex h-8 cursor-row-resize flex-col items-stretch justify-center"
            )}
            onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                beginSplitResize(e.clientX, e.clientY);
            }}
        >
            <div
                className={cn(
                    "bg-border hover:bg-primary/30",
                    layout === "horizontal" ? "h-full w-2" : "h-2 w-full"
                )}
            />
        </div>
    );

    return (
        <div
            ref={containerRef}
            className="relative flex h-full min-h-0 w-full flex-col bg-background"
        >
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <Select
                        value={layout}
                        onValueChange={(value) =>
                            setLayout(value as DisplayLayout)
                        }
                    >
                        <SelectTrigger
                            size="sm"
                            className="bg-background"
                            aria-label="Display layout"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="clockOnly">Clock only</SelectItem>
                            <SelectItem value="classOnly">Class only</SelectItem>
                            <SelectItem value="vertical">Vert</SelectItem>
                            <SelectItem value="horizontal">Horizontal</SelectItem>
                        </SelectContent>
                    </Select>
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

            {layout === "clockOnly" ? (
                <div className="min-h-0 flex-1">{clockPanel}</div>
            ) : layout === "classOnly" ? (
                <div className="min-h-0 flex-1">{classPanel}</div>
            ) : (
                <div
                    className={cn(
                        "flex min-h-0 flex-1",
                        layout === "horizontal" ? "flex-row" : "flex-col"
                    )}
                >
                    <div
                        className="min-h-0 min-w-0 overflow-hidden"
                        style={{
                            [layout === "horizontal" ? "width" : "height"]:
                                `${splitRatio}%`,
                        }}
                    >
                        {clockPanel}
                    </div>
                    {splitDivider}
                    {classPanel}
                </div>
            )}
        </div>
    );
}
