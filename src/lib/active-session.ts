import type { Timer, Rotation } from "@/lib/types";
import { secondsUntilEndTime } from "@/lib/timer-utils";
import {
    type AudioCues,
    resolveAudioCues,
    type ResolvedAudioCues,
} from "@/lib/audio-cues";

export type SegmentKind = "timer" | "work" | "transition";

export type Segment = {
    kind: SegmentKind;
    label: string;
    durationSeconds: number;
    bgColor: string;
    audioCues: ResolvedAudioCues;
    endTime?: string;
};

export type ActiveSession = {
    name: string;
    segments: Segment[];
    index: number;
    bgTransition?: string;
    audioCues: ResolvedAudioCues;
};

export type TimerEndBehavior = "countUp" | "hold" | "return";

export function getCurrentSegment(session: ActiveSession): Segment {
    return session.segments[session.index]!;
}

export function getCurrentBgColor(
    session: ActiveSession | null,
    clockBgColor: string
): string {
    if (!session) return clockBgColor;
    return getCurrentSegment(session).bgColor;
}

function buildSegment(
    kind: SegmentKind,
    label: string,
    durationSeconds: number,
    bgColor: string,
    endTime?: string,
    ...cueLayers: (AudioCues | undefined)[]
): Segment {
    return {
        kind,
        label,
        durationSeconds,
        bgColor,
        endTime,
        audioCues: resolveAudioCues(...cueLayers),
    };
}

export function resolveSegmentDuration(segment: Segment): number {
    if (segment.endTime) {
        return secondsUntilEndTime(segment.endTime);
    }
    return segment.durationSeconds;
}

export function buildTimerSegmentFromDoc(
    timer: Timer,
    globalCues?: AudioCues
): Segment {
    const durationSeconds = timer.endTime
        ? secondsUntilEndTime(timer.endTime)
        : timer.durationSeconds;

    return buildSegment(
        "timer",
        timer.name,
        durationSeconds,
        timer.bgColor,
        timer.endTime,
        (timer.audioCues as AudioCues | undefined) ?? undefined,
        globalCues
    );
}

export function appendTimerToSession(
    session: ActiveSession,
    timer: Timer,
    globalCues?: AudioCues
): ActiveSession {
    return {
        ...session,
        segments: [
            ...session.segments,
            buildTimerSegmentFromDoc(timer, globalCues),
        ],
    };
}

export function buildTimerSession(
    durationSeconds: number,
    bgColor: string,
    name: string,
    globalCues: AudioCues | undefined,
    itemCues: AudioCues | undefined,
    bgTransition?: string
): ActiveSession {
    const sessionCues = resolveAudioCues(itemCues, globalCues);
    return {
        name,
        segments: [
            buildSegment(
                "timer",
                name,
                durationSeconds,
                bgColor,
                undefined,
                itemCues,
                globalCues
            ),
        ],
        index: 0,
        bgTransition,
        audioCues: sessionCues,
    };
}

export function buildQuickPresetSession(
    durationSeconds: number,
    timerBgColor: string,
    globalCues?: AudioCues
): ActiveSession {
    return buildTimerSession(
        durationSeconds,
        timerBgColor,
        "Quick timer",
        globalCues,
        undefined
    );
}

export function buildTimerChainSegments(
    startTimer: Timer,
    allTimers: Timer[],
    globalCues?: AudioCues
): Segment[] {
    const byId = new Map(allTimers.map((timer) => [timer.id, timer]));
    const segments: Segment[] = [];
    const visited = new Set<string>();
    let current: Timer | undefined = startTimer;

    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        segments.push(buildTimerSegmentFromDoc(current, globalCues));
        if (!current.nextTimer?.id) break;
        const next = byId.get(current.nextTimer.id);
        if (!next) break;
        current = next;
    }

    return segments;
}

export function buildCustomTimerSession(
    timer: Timer,
    globalCues?: AudioCues,
    allTimers?: Timer[]
): ActiveSession {
    const segments =
        allTimers && allTimers.length > 0
            ? buildTimerChainSegments(timer, allTimers, globalCues)
            : [buildTimerSegmentFromDoc(timer, globalCues)];
    const sessionCues = resolveAudioCues(
        (timer.audioCues as AudioCues | undefined) ?? undefined,
        globalCues
    );

    return {
        name: timer.name,
        segments,
        index: 0,
        bgTransition: timer.bgTransition,
        audioCues: sessionCues,
    };
}

export function buildRotationSession(
    rotation: Rotation,
    globalCues?: AudioCues
): ActiveSession {
    const segments: Segment[] = [];
    const transitionSeconds = Number(rotation.transitionDuration);
    const finalTransition = rotation.finalTransition ?? false;
    const sessionCues = resolveAudioCues(
        (rotation.audioCues as AudioCues | undefined) ?? undefined,
        globalCues
    );

    for (let i = 1; i <= rotation.numberOfRotations; i++) {
        segments.push(
            buildSegment(
                "work",
                `Rotation ${i} of ${rotation.numberOfRotations}`,
                rotation.rotationsDurationSeconds,
                rotation.rotationsBgColor,
                undefined,
                (rotation.workCues as AudioCues | undefined) ?? undefined,
                (rotation.audioCues as AudioCues | undefined) ?? undefined,
                globalCues
            )
        );

        const isLastRotation = i === rotation.numberOfRotations;
        const shouldAddTransition = !isLastRotation || finalTransition;

        if (shouldAddTransition && transitionSeconds > 0) {
            segments.push(
                buildSegment(
                    "transition",
                    "Transition",
                    transitionSeconds,
                    rotation.transitionBgColor,
                    undefined,
                    (rotation.transitionCues as AudioCues | undefined) ??
                        undefined,
                    (rotation.audioCues as AudioCues | undefined) ?? undefined,
                    globalCues
                )
            );
        }
    }

    return {
        name: rotation.name,
        segments,
        index: 0,
        bgTransition: rotation.bgTransition,
        audioCues: sessionCues,
    };
}

export function isRotationSession(session: ActiveSession): boolean {
    return session.segments.some((segment) => segment.kind === "work");
}

export type RotationEndTime = {
    label: string;
    endMs: number;
    segmentIndex: number;
    isCurrent: boolean;
};

export function getRotationEndTimes(
    session: ActiveSession,
    currentEndsAtMs: number
): RotationEndTime[] {
    const segmentEndMs = new Array<number>(session.segments.length);
    segmentEndMs[session.index] = currentEndsAtMs;

    for (let i = session.index + 1; i < session.segments.length; i++) {
        segmentEndMs[i] =
            segmentEndMs[i - 1]! + session.segments[i]!.durationSeconds * 1000;
    }

    for (let i = session.index - 1; i >= 0; i--) {
        segmentEndMs[i] =
            segmentEndMs[i + 1]! - session.segments[i + 1]!.durationSeconds * 1000;
    }

    return session.segments.flatMap((segment, segmentIndex) => {
        if (segment.kind !== "work") return [];

        return [
            {
                label: segment.label,
                endMs: segmentEndMs[segmentIndex]!,
                segmentIndex,
                isCurrent: segmentIndex === session.index,
            },
        ];
    });
}

export function isLastSegment(session: ActiveSession): boolean {
    return session.index >= session.segments.length - 1;
}

export function advanceSegment(session: ActiveSession): ActiveSession | null {
    if (isLastSegment(session)) return null;
    return {
        ...session,
        index: session.index + 1,
    };
}

export function formatCountdown(totalSeconds: number): string {
    const isOvertime = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;

    const time =
        hours > 0
            ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            : `${minutes}:${String(seconds).padStart(2, "0")}`;

    return isOvertime ? `+${time}` : time;
}

export function formatEndTimestamp(endMs: number, timeFormat: string): string {
    return new Date(endMs).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: timeFormat === "12h",
    });
}

export function formatWallTime(now: Date, timeFormat: string): string {
    return now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: timeFormat === "12h",
    });
}

export function parseSessionJson(json: unknown): ActiveSession | null {
    if (!json || typeof json !== "object") return null;
    const session = json as ActiveSession;
    if (!session.segments || !Array.isArray(session.segments)) return null;
    if (typeof session.index !== "number") return null;
    return session;
}

export function serializeSession(session: ActiveSession): ActiveSession {
    return JSON.parse(JSON.stringify(session)) as ActiveSession;
}
