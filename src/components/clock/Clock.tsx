import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ListPlus,
    Minus,
    Pause,
    Play,
    Plus,
    RotateCcw,
    SkipForward,
    Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from "@/components/ui/popover";
import { AnimatedBackground } from "@/components/clock/AnimatedBackground";
import { YouTubeOverlay } from "@/components/clock/YouTubeOverlay";
import { cn } from "@/lib/utils";
import {
    DEFAULT_BG_TRANSITION,
    type BgTransition,
    resolveBgTransition,
} from "@/lib/bg-transitions";
import type { AudioCues } from "@/lib/audio-cues";
import { createAudioUrlMap, useAudioPlayer } from "@/lib/audio-engine";
import {
    type ActiveSession,
    appendTimerToSession,
    buildCustomTimerSession,
    buildQuickPresetSession,
    buildRotationSession,
    formatCountdown,
    formatEndTimestamp,
    formatWallTime,
    getCurrentBgColor,
    getCurrentSegment,
    getRotationEndTimes,
    isLastSegment,
    isRotationSession,
    parseSessionJson,
    resolveSegmentDuration,
    type TimerEndBehavior,
} from "@/lib/active-session";
import {
    adjustDisplaySession,
    advanceDisplaySegment,
    pauseDisplaySession,
    remainingFromDisplaySession,
    resumeDisplaySession,
    skipDisplaySegment,
    startDisplaySession,
    stopDisplaySession,
    updateDisplaySession,
    ensureDisplaySession,
} from "@/lib/display-session";
import { getContrastTextColor, getOvertimeTextColor } from "@/lib/color-contrast";
import type { Rotation, Timer } from "@/lib/types";
import {
    toAudioUrlList,
    useAudioFiles,
    useDisplaySession,
    useRotations,
    useTimers,
} from "@/hooks/use-clock-queries";

interface ClockProps {
    userId: string;
    isRunner?: boolean;
    compact?: boolean;
    timeFormat?: string;
    clockSize?: number;
    dateSize?: number;
    dateLocation?: string;
    clockBgColor?: string;
    timerBgColor?: string;
    currentTimeSize?: number;
    endTimeSize?: number;
    timerTitleSize?: number;
    timerEndBehavior?: TimerEndBehavior;
    overtimeAutoDismissSeconds?: number;
    bgTransition?: BgTransition;
    globalAudioCues?: AudioCues;
}

function formatTime(date: Date, timeFormat: string): string {
    return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: timeFormat === "12h",
    });
}

function formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function normalizeDateLocation(location: string): string {
    if (location === "top") return "above";
    return location;
}

const DURATION_PRESETS = [
    { label: "10s", seconds: 10 },
    { label: "30s", seconds: 30 },
    { label: "1m", seconds: 60 },
    { label: "5m", seconds: 300 },
    { label: "10m", seconds: 600 },
    { label: "15m", seconds: 900 },
    { label: "20m", seconds: 1200 },
    { label: "25m", seconds: 1500 },
    { label: "30m", seconds: 1800 },
] as const;

const TIME_ADJUSTMENTS = [
    { label: "1s", seconds: 1 },
    { label: "5s", seconds: 5 },
    { label: "10s", seconds: 10 },
    { label: "1m", seconds: 60 },
    { label: "5m", seconds: 300 },
    { label: "10m", seconds: 600 },
] as const;

const ADJUST_BELOW_ZERO_MESSAGE = "Timer cannot go below zero.";

function DurationPresetButtons({
    onSelect,
}: {
    onSelect: (seconds: number) => void;
}) {
    return (
        <div className="w-full min-w-0 px-4">
            <div className="flex flex-wrap justify-center gap-2">
                {DURATION_PRESETS.map((preset) => (
                    <Button
                        key={preset.label}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="min-w-10 rounded-lg px-2"
                        onClick={() => onSelect(preset.seconds)}
                    >
                        {preset.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

function QuickPickList<T extends { id: string; name: string }>({
    title,
    items,
    onSelect,
}: {
    title: string;
    items: T[] | undefined;
    onSelect: (item: T) => void;
}) {
    return (
        <div className="w-full min-w-0 px-4">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {title}
            </h2>
            {items === undefined ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <Button
                            key={item.id}
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelect(item)}
                        >
                            {item.name}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function TimeAdjustButton({
    buttonKey,
    deltaSeconds,
    remaining,
    errorKey,
    onError,
    onAdjust,
    children,
}: {
    buttonKey: string;
    deltaSeconds: number;
    remaining: number;
    errorKey: string | null;
    onError: (key: string | null) => void;
    onAdjust: (deltaSeconds: number) => void;
    children: React.ReactNode;
}) {
    const open = errorKey === buttonKey;

    useEffect(() => {
        if (!open) return;
        const timeout = window.setTimeout(() => onError(null), 2500);
        return () => window.clearTimeout(timeout);
    }, [open, onError]);

    const handleClick = () => {
        if (remaining + deltaSeconds < 0) {
            onError(buttonKey);
            return;
        }
        onError(null);
        onAdjust(deltaSeconds);
    };

    return (
        <Popover
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) onError(null);
            }}
        >
            <PopoverAnchor asChild>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleClick}
                >
                    {children}
                </Button>
            </PopoverAnchor>
            <PopoverContent side="top" className="text-destructive">
                {ADJUST_BELOW_ZERO_MESSAGE}
            </PopoverContent>
        </Popover>
    );
}

function ActiveTransportControls({
    session,
    paused,
    remaining,
    onAdjust,
    onPauseToggle,
    onSkip,
    onStop,
}: {
    session: ActiveSession;
    paused: boolean;
    remaining: number;
    onAdjust: (deltaSeconds: number) => void;
    onPauseToggle: () => void;
    onSkip: () => void;
    onStop: () => void;
}) {
    const canSkip = session.segments.length > 1;
    const [adjustErrorKey, setAdjustErrorKey] = useState<string | null>(null);

    return (
        <div className="flex w-full min-w-0 flex-col items-center gap-3 px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
                {[...TIME_ADJUSTMENTS].reverse().map((preset) => (
                    <TimeAdjustButton
                        key={`minus-${preset.label}`}
                        buttonKey={`minus-${preset.label}`}
                        deltaSeconds={-preset.seconds}
                        remaining={remaining}
                        errorKey={adjustErrorKey}
                        onError={setAdjustErrorKey}
                        onAdjust={onAdjust}
                    >
                        <Minus />
                        {preset.label}
                    </TimeAdjustButton>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onPauseToggle}
                >
                    {paused ? <Play /> : <Pause />}
                    {paused ? "Resume" : "Pause"}
                </Button>
                {canSkip && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onSkip}
                    >
                        <SkipForward />
                        Skip
                    </Button>
                )}
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onStop}
                >
                    <Square />
                    Stop
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onStop}
                >
                    <RotateCcw />
                    Reset
                </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {TIME_ADJUSTMENTS.map((preset) => (
                    <TimeAdjustButton
                        key={`plus-${preset.label}`}
                        buttonKey={`plus-${preset.label}`}
                        deltaSeconds={preset.seconds}
                        remaining={remaining}
                        errorKey={adjustErrorKey}
                        onError={setAdjustErrorKey}
                        onAdjust={onAdjust}
                    >
                        <Plus />
                        {preset.label}
                    </TimeAdjustButton>
                ))}
            </div>
        </div>
    );
}

export function Clock({
    userId,
    isRunner = false,
    compact = false,
    timeFormat = "24h",
    clockSize = 72,
    dateSize = 24,
    dateLocation = "bottom",
    clockBgColor = "#ffffff",
    timerBgColor = "#15803d",
    currentTimeSize = 24,
    endTimeSize = 24,
    timerTitleSize = 20,
    timerEndBehavior = "countUp",
    overtimeAutoDismissSeconds = 0,
    bgTransition = DEFAULT_BG_TRANSITION,
    globalAudioCues,
}: ClockProps) {
    const [now, setNow] = useState(() => new Date());
    const [queuePopoverOpen, setQueuePopoverOpen] = useState(false);
    const [tick, setTick] = useState(0);

    const { data: displayData } = useDisplaySession(userId);
    const { data: timersData } = useTimers(userId);
    const { data: rotationsData } = useRotations(userId);
    const { data: audioData } = useAudioFiles(userId);

    const displaySession = displayData?.displaySessions?.[0];
    const session = useMemo(
        () => parseSessionJson(displaySession?.sessionJson),
        [displaySession?.sessionJson]
    );
    const endsAt = displaySession?.endsAt ?? null;
    const paused = displaySession?.paused ?? false;
    const pausedRemainingMs = displaySession?.pausedRemainingMs ?? null;
    const timers = timersData?.timers as Timer[] | undefined;
    const rotations = rotationsData?.rotations as Rotation[] | undefined;

    const remaining = useMemo(() => {
        void tick;
        return remainingFromDisplaySession(endsAt, paused, pausedRemainingMs);
    }, [endsAt, paused, pausedRemainingMs, tick]);

    const sessionRef = useRef<ActiveSession | null>(null);
    sessionRef.current = session;
    const prevRemainingRef = useRef<number | null>(null);
    const firedWarningsRef = useRef(new Set<string>());
    const firedOvertimeRef = useRef(false);
    const firedSegmentEndRef = useRef<number | null>(null);
    const lastTickSecondRef = useRef<number | null>(null);
    const segmentStartMsRef = useRef<number | null>(null);
    const lastIntervalChimeRef = useRef(0);
    const lastSessionIndexRef = useRef<number | null>(null);

    const urlMap = createAudioUrlMap(toAudioUrlList(audioData?.audioFiles ?? []));
    const {
        playById,
        unlock,
        startPlayDuring,
        stopPlayDuring,
        stopAll,
        pauseAll,
        resumeAll,
    } = useAudioPlayer(urlMap);
    const playByIdRef = useRef(playById);
    playByIdRef.current = playById;
    const startPlayDuringRef = useRef(startPlayDuring);
    startPlayDuringRef.current = startPlayDuring;
    const stopPlayDuringRef = useRef(stopPlayDuring);
    stopPlayDuringRef.current = stopPlayDuring;
    const stopAllRef = useRef(stopAll);
    stopAllRef.current = stopAll;
    const pauseAllRef = useRef(pauseAll);
    pauseAllRef.current = pauseAll;
    const resumeAllRef = useRef(resumeAll);
    resumeAllRef.current = resumeAll;

    const resetSegmentAudioState = useCallback((segmentIndex: number) => {
        firedWarningsRef.current = new Set(
            [...firedWarningsRef.current].filter(
                (key) => !key.startsWith(`${segmentIndex}-`)
            )
        );
        firedOvertimeRef.current = false;
        firedSegmentEndRef.current = null;
        lastTickSecondRef.current = null;
        segmentStartMsRef.current = Date.now();
        lastIntervalChimeRef.current = 0;
    }, []);

    const playSegmentStart = useCallback((activeSession: ActiveSession) => {
        if (!isRunner) return;
        const segment = activeSession.segments[activeSession.index]!;
        stopPlayDuringRef.current();
        playByIdRef.current(
            segment.audioCues.segmentStart.audioId,
            segment.audioCues.segmentStart.repeat
        );
        startPlayDuringRef.current(segment.audioCues.playDuring.audioId);
    }, [isRunner]);

    const position = normalizeDateLocation(dateLocation);
    const currentBgColor = getCurrentBgColor(session, clockBgColor);
    const activeBgTransition = resolveBgTransition(
        session?.bgTransition,
        bgTransition
    );
    const textColor = getContrastTextColor(currentBgColor);
    const overtimeTextColor = getOvertimeTextColor(currentBgColor);

    const handleStartSession = useCallback(
        async (newSession: ActiveSession) => {
            unlock();
            if (isRunner) {
                resetSegmentAudioState(newSession.index);
                prevRemainingRef.current = resolveSegmentDuration(
                    newSession.segments[newSession.index]!
                );
                playSegmentStart(newSession);
            }
            await startDisplaySession(userId, newSession);
        },
        [userId, unlock, isRunner, resetSegmentAudioState, playSegmentStart]
    );

    const handleQuickPreset = useCallback(
        (seconds: number) => {
            void handleStartSession(
                buildQuickPresetSession(seconds, timerBgColor, globalAudioCues)
            );
        },
        [handleStartSession, timerBgColor, globalAudioCues]
    );

    const handleTimerSelect = useCallback(
        (timer: Timer) => {
            void handleStartSession(
                buildCustomTimerSession(timer, globalAudioCues, timers ?? [])
            );
        },
        [handleStartSession, globalAudioCues, timers]
    );

    const handleRotationSelect = useCallback(
        (rotation: Rotation) => {
            void handleStartSession(
                buildRotationSession(rotation, globalAudioCues)
            );
        },
        [handleStartSession, globalAudioCues]
    );

    const handleQueueTimer = useCallback(
        async (timer: Timer) => {
            if (!session || !displaySession) return;
            const updated = appendTimerToSession(
                session,
                timer,
                globalAudioCues
            );
            await updateDisplaySession(displaySession.id, {
                sessionJson: updated,
            });
            setQueuePopoverOpen(false);
        },
        [session, displaySession, globalAudioCues]
    );

    const adjustTime = useCallback(
        (deltaSeconds: number) => {
            void adjustDisplaySession(
                userId,
                deltaSeconds,
                endsAt,
                paused,
                pausedRemainingMs
            );
        },
        [userId, endsAt, paused, pausedRemainingMs]
    );

    const stopSession = useCallback(
        async (playSound = false) => {
            if (playSound && isRunner && sessionRef.current) {
                stopAllRef.current();
                const segment = getCurrentSegment(sessionRef.current);
                playByIdRef.current(
                    segment.audioCues.stop.audioId,
                    segment.audioCues.stop.repeat,
                    true
                );
            } else if (isRunner) {
                stopPlayDuringRef.current();
            }
            prevRemainingRef.current = null;
            firedWarningsRef.current.clear();
            firedOvertimeRef.current = false;
            firedSegmentEndRef.current = null;
            lastTickSecondRef.current = null;
            segmentStartMsRef.current = null;
            lastIntervalChimeRef.current = 0;
            await stopDisplaySession(userId);
        },
        [userId, isRunner]
    );

    const skipSegment = useCallback(async () => {
        const current = sessionRef.current;
        if (!current) return;

        if (isRunner) {
            const segment = getCurrentSegment(current);
            stopPlayDuringRef.current();
            playByIdRef.current(
                segment.audioCues.skip.audioId,
                segment.audioCues.skip.repeat
            );
        }

        const next = await skipDisplaySegment(userId, current);
        if (next && isRunner) {
            resetSegmentAudioState(next.index);
            prevRemainingRef.current = resolveSegmentDuration(
                next.segments[next.index]!
            );
            playSegmentStart(next);
        } else if (!next && isRunner) {
            stopAllRef.current();
        }
    }, [userId, isRunner, resetSegmentAudioState, playSegmentStart]);

    const handlePauseToggle = useCallback(async () => {
        const current = sessionRef.current;
        if (!current) return;

        if (paused) {
            const remainingMs =
                pausedRemainingMs ??
                (endsAt ? Math.max(0, endsAt - Date.now()) : 0);
            if (isRunner) {
                const cues = getCurrentSegment(current).audioCues;
                playByIdRef.current(
                    cues.resume.audioId,
                    cues.resume.repeat,
                    true,
                    true
                );
                resumeAllRef.current();
            }
            await resumeDisplaySession(userId, remainingMs);
        } else {
            const remainingMs = endsAt
                ? Math.max(0, endsAt - Date.now())
                : 0;
            if (isRunner) {
                pauseAllRef.current();
                const cues = getCurrentSegment(current).audioCues;
                playByIdRef.current(
                    cues.pause.audioId,
                    cues.pause.repeat,
                    true,
                    true
                );
            }
            await pauseDisplaySession(userId, remainingMs);
        }
    }, [userId, paused, pausedRemainingMs, endsAt, isRunner]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
            setTick((t) => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isRunner || !session) return;
        if (lastSessionIndexRef.current !== session.index) {
            lastSessionIndexRef.current = session.index;
            resetSegmentAudioState(session.index);
            prevRemainingRef.current = remaining;
            playSegmentStart(session);
        }
    }, [session, isRunner, resetSegmentAudioState, playSegmentStart, remaining]);

    useEffect(() => {
        if (!isRunner || !session || paused) return;

        const segment = getCurrentSegment(session);
        const cues = segment.audioCues;
        const prev = prevRemainingRef.current;

        for (const rule of cues.timeRemaining) {
            const key = `${session.index}-${rule.secondsRemaining}`;
            if (
                rule.audioId &&
                prev !== null &&
                prev > rule.secondsRemaining &&
                remaining <= rule.secondsRemaining &&
                remaining > 0 &&
                !firedWarningsRef.current.has(key)
            ) {
                firedWarningsRef.current.add(key);
                playByIdRef.current(rule.audioId, rule.repeat);
            }
        }

        if (
            cues.countdownTick.audioId &&
            remaining > 0 &&
            remaining <= cues.countdownTick.lastSeconds &&
            lastTickSecondRef.current !== remaining
        ) {
            lastTickSecondRef.current = remaining;
            playByIdRef.current(cues.countdownTick.audioId, 1);
        }

        if (
            timerEndBehavior === "countUp" &&
            isLastSegment(session) &&
            prev !== null &&
            prev > 0 &&
            remaining <= 0 &&
            !firedOvertimeRef.current
        ) {
            firedOvertimeRef.current = true;
            playByIdRef.current(
                cues.overtimeStart.audioId,
                cues.overtimeStart.repeat
            );
        }

        if (segmentStartMsRef.current && cues.intervalChime.audioId) {
            const elapsedMinutes = Math.floor(
                (Date.now() - segmentStartMsRef.current) / 60000
            );
            const chimeCount = Math.floor(
                elapsedMinutes / cues.intervalChime.everyMinutes
            );
            if (chimeCount > lastIntervalChimeRef.current && elapsedMinutes > 0) {
                lastIntervalChimeRef.current = chimeCount;
                playByIdRef.current(cues.intervalChime.audioId, 1);
            }
        }

        prevRemainingRef.current = remaining;
    }, [remaining, session, paused, timerEndBehavior, isRunner]);

    useEffect(() => {
        if (!isRunner || !session || paused) return;
        if (remaining > 0) return;
        if (firedSegmentEndRef.current === session.index) return;

        const segment = getCurrentSegment(session);
        firedSegmentEndRef.current = session.index;
        stopPlayDuringRef.current();
        playByIdRef.current(
            segment.audioCues.segmentEnd.audioId,
            segment.audioCues.segmentEnd.repeat
        );

        if (!isLastSegment(session)) {
            void advanceDisplaySegment(userId, session).then((next) => {
                if (next) {
                    resetSegmentAudioState(next.index);
                    prevRemainingRef.current = resolveSegmentDuration(
                        next.segments[next.index]!
                    );
                    playSegmentStart(next);
                }
            });
            return;
        }

        if (timerEndBehavior !== "countUp") {
            playByIdRef.current(
                segment.audioCues.sessionComplete.audioId,
                segment.audioCues.sessionComplete.repeat
            );
        }

        if (timerEndBehavior === "return") {
            void stopSession();
        }
    }, [
        remaining,
        session,
        paused,
        timerEndBehavior,
        stopSession,
        userId,
        isRunner,
        resetSegmentAudioState,
        playSegmentStart,
    ]);

    useEffect(() => {
        if (!isRunner || !session || paused) return;
        if (timerEndBehavior !== "countUp") return;
        if (overtimeAutoDismissSeconds <= 0) return;
        if (!isLastSegment(session)) return;
        if (remaining > -overtimeAutoDismissSeconds) return;

        const segment = getCurrentSegment(session);
        playByIdRef.current(
            segment.audioCues.sessionComplete.audioId,
            segment.audioCues.sessionComplete.repeat
        );
        void stopSession();
    }, [
        remaining,
        session,
        paused,
        timerEndBehavior,
        overtimeAutoDismissSeconds,
        stopSession,
        isRunner,
    ]);

    useEffect(() => {
        void ensureDisplaySession(userId);
    }, [userId]);

    const dateElement = (
        <p
            className="font-mono tabular-nums"
            style={{ fontSize: `${dateSize}px` }}
        >
            {formatDate(now)}
        </p>
    );

    const activeSegment = session ? getCurrentSegment(session) : null;
    const upcomingSegments = session
        ? session.segments.slice(session.index + 1)
        : [];
    const rotationEndTimes =
        session && endsAt !== null && isRotationSession(session)
            ? getRotationEndTimes(session, endsAt)
            : [];

    const activeMainContent = session && activeSegment && (
        <>
            <div className="flex w-full flex-col items-center gap-1">
                {position === "above" && dateElement}
                <p
                    className="font-mono tabular-nums"
                    style={{ fontSize: `${currentTimeSize}px` }}
                >
                    {formatWallTime(now, timeFormat)}
                </p>
            </div>
            <div className="flex flex-col items-center gap-1">
                <p
                    className="font-medium"
                    style={{ fontSize: `${timerTitleSize}px` }}
                >
                    {activeSegment.label}
                </p>
                <time
                    className={cn(
                        "font-mono tabular-nums leading-none tracking-tight select-none"
                    )}
                    style={{
                        fontSize: `${clockSize}px`,
                        color: remaining < 0 ? overtimeTextColor : undefined,
                    }}
                >
                    {formatCountdown(remaining)}
                </time>
                {position === "bottom" && dateElement}
            </div>
            <div
                className="flex flex-col items-center gap-1"
                style={{ fontSize: `${endTimeSize}px` }}
            >
                <p className="font-mono tabular-nums">
                    Ends{" "}
                    {endsAt !== null
                        ? formatEndTimestamp(endsAt, timeFormat)
                        : ""}
                </p>
                {upcomingSegments.length > 0 && (
                    <div className="flex flex-col items-center gap-0.5 opacity-70">
                        <p className="text-sm font-medium">Up next</p>
                        {upcomingSegments.map((seg, index) => (
                            <p
                                key={`${seg.label}-${index}`}
                                className="font-mono tabular-nums text-sm"
                            >
                                {seg.label}
                            </p>
                        ))}
                    </div>
                )}
                {rotationEndTimes.length > 0 && (
                    <div className="flex flex-col items-center gap-0.5 opacity-70">
                        {rotationEndTimes.map((rotation) => (
                            <p
                                key={rotation.segmentIndex}
                                className={cn(
                                    "font-mono tabular-nums",
                                    rotation.isCurrent && "font-medium opacity-100"
                                )}
                            >
                                {rotation.label} —{" "}
                                {formatEndTimestamp(rotation.endMs, timeFormat)}
                            </p>
                        ))}
                    </div>
                )}
            </div>
            {!compact && (
                <>
                    <ActiveTransportControls
                        session={session}
                        paused={paused}
                        remaining={remaining}
                        onAdjust={adjustTime}
                        onPauseToggle={() => void handlePauseToggle()}
                        onSkip={() => void skipSegment()}
                        onStop={() => void stopSession(true)}
                    />
                    <Popover
                        open={queuePopoverOpen}
                        onOpenChange={setQueuePopoverOpen}
                    >
                        <PopoverAnchor asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setQueuePopoverOpen((o) => !o)}
                            >
                                <ListPlus />
                                Queue timer
                            </Button>
                        </PopoverAnchor>
                        <PopoverContent className="w-72 p-3" side="top">
                            <p className="mb-2 text-sm font-medium">
                                Play after current segment
                            </p>
                            {timers === undefined ? (
                                <p className="text-sm opacity-70">Loading...</p>
                            ) : timers.length === 0 ? (
                                <p className="text-sm opacity-70">
                                    No saved timers
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {timers.map((timer) => (
                                        <Button
                                            key={timer.id}
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                void handleQueueTimer(timer)
                                            }
                                        >
                                            {timer.name}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </>
            )}
        </>
    );

    const idleMainContent = !session && !compact && (
        <>
            <div className="flex flex-col items-center gap-1">
                {position === "above" && dateElement}
                <time
                    className={cn(
                        "font-mono tabular-nums leading-none tracking-tight select-none"
                    )}
                    style={{ fontSize: `${clockSize}px` }}
                    dateTime={now.toISOString()}
                >
                    {formatTime(now, timeFormat)}
                </time>
                {position === "bottom" && dateElement}
            </div>
            <DurationPresetButtons onSelect={handleQuickPreset} />
            <div className="grid w-full gap-3 sm:grid-cols-2">
                <QuickPickList
                    title="Timers"
                    items={timers}
                    onSelect={handleTimerSelect}
                />
                <QuickPickList
                    title="Rotations"
                    items={rotations}
                    onSelect={handleRotationSelect}
                />
            </div>
        </>
    );

    const activeVideo =
        session && activeSegment ? activeSegment.audioCues.video : null;

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-2">
            <AnimatedBackground
                color={currentBgColor}
                transition={activeBgTransition}
            />
            {activeVideo?.youtubeId && session && (
                <YouTubeOverlay
                    video={activeVideo}
                    segmentKey={`${session.name}-${session.index}`}
                    paused={paused}
                />
            )}
            {position === "upper-left" && (
                <div
                    className="absolute top-0 left-4 z-10"
                    style={{ color: textColor }}
                >
                    {dateElement}
                </div>
            )}
            {position === "upper-right" && (
                <div
                    className="absolute top-0 right-4 z-10 text-right"
                    style={{ color: textColor }}
                >
                    {dateElement}
                </div>
            )}
            <div
                className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-3"
                style={{ color: textColor }}
            >
                {activeMainContent}
                {idleMainContent}
            </div>
        </div>
    );
}
