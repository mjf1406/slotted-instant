import {
    normalizeVideoPosition,
    normalizeVideoSize,
    parseYouTubeId,
    type VideoPosition,
    type VideoSize,
} from "@/lib/youtube";

export type CueRef = string | "none";

export type AudioCueSlot = {
    audioId?: CueRef;
    repeat?: number;
};

export type CountdownTickCue = {
    audioId?: CueRef;
    lastSeconds?: number;
};

export type IntervalChimeCue = {
    audioId?: CueRef;
    everyMinutes?: number;
};

export type TimeRemainingCue = {
    audioId?: CueRef;
    secondsRemaining: number;
    repeat?: number;
};

export type PlayDuringCue = {
    audioId?: CueRef;
};

export type VideoCue = {
    youtubeId?: string | "none";
    position?: string;
    size?: string;
    muted?: boolean;
};

export type AudioCues = {
    segmentStart?: AudioCueSlot;
    playDuring?: PlayDuringCue;
    video?: VideoCue;
    segmentEnd?: AudioCueSlot;
    sessionComplete?: AudioCueSlot;
    overtimeStart?: AudioCueSlot;
    pause?: AudioCueSlot;
    resume?: AudioCueSlot;
    skip?: AudioCueSlot;
    stop?: AudioCueSlot;
    countdownTick?: CountdownTickCue;
    intervalChime?: IntervalChimeCue;
    timeRemaining?: TimeRemainingCue[];
};

export type ResolvedCueSlot = {
    audioId: string | null;
    repeat: number;
};

export type ResolvedCountdownTick = {
    audioId: string | null;
    lastSeconds: number;
};

export type ResolvedIntervalChime = {
    audioId: string | null;
    everyMinutes: number;
};

export type ResolvedTimeRemainingCue = {
    audioId: string | null;
    secondsRemaining: number;
    repeat: number;
};

export type ResolvedPlayDuring = {
    audioId: string | null;
};

export type ResolvedVideoCue = {
    youtubeId: string | null;
    position: VideoPosition;
    size: VideoSize;
    muted: boolean;
};

export type ResolvedAudioCues = {
    segmentStart: ResolvedCueSlot;
    playDuring: ResolvedPlayDuring;
    video: ResolvedVideoCue;
    segmentEnd: ResolvedCueSlot;
    sessionComplete: ResolvedCueSlot;
    overtimeStart: ResolvedCueSlot;
    pause: ResolvedCueSlot;
    resume: ResolvedCueSlot;
    skip: ResolvedCueSlot;
    stop: ResolvedCueSlot;
    countdownTick: ResolvedCountdownTick;
    intervalChime: ResolvedIntervalChime;
    timeRemaining: ResolvedTimeRemainingCue[];
};

export const DEFAULT_AUDIO_CUES: ResolvedAudioCues = {
    segmentStart: { audioId: null, repeat: 1 },
    playDuring: { audioId: null },
    video: { youtubeId: null, position: "top", size: "small", muted: false },
    segmentEnd: { audioId: null, repeat: 1 },
    sessionComplete: { audioId: null, repeat: 1 },
    overtimeStart: { audioId: null, repeat: 1 },
    pause: { audioId: null, repeat: 1 },
    resume: { audioId: null, repeat: 1 },
    skip: { audioId: null, repeat: 1 },
    stop: { audioId: null, repeat: 1 },
    countdownTick: { audioId: null, lastSeconds: 10 },
    intervalChime: { audioId: null, everyMinutes: 5 },
    timeRemaining: [],
};

const SLOT_KEYS = [
    "segmentStart",
    "segmentEnd",
    "sessionComplete",
    "overtimeStart",
    "pause",
    "resume",
    "skip",
    "stop",
] as const;

type SlotKey = (typeof SLOT_KEYS)[number];

function resolveSlot(
    layers: (AudioCues | undefined)[],
    key: SlotKey
): ResolvedCueSlot {
    for (const layer of layers) {
        const slot = layer?.[key];
        if (!slot) continue;
        if (slot.audioId === "none") {
            return { audioId: null, repeat: slot.repeat ?? 1 };
        }
        if (slot.audioId) {
            return { audioId: slot.audioId, repeat: slot.repeat ?? 1 };
        }
    }
    return { audioId: null, repeat: 1 };
}

function resolveCountdownTick(
    layers: (AudioCues | undefined)[]
): ResolvedCountdownTick {
    for (const layer of layers) {
        const cue = layer?.countdownTick;
        if (!cue) continue;
        if (cue.audioId === "none") {
            return {
                audioId: null,
                lastSeconds:
                    cue.lastSeconds ??
                    DEFAULT_AUDIO_CUES.countdownTick.lastSeconds,
            };
        }
        if (cue.audioId || cue.lastSeconds !== undefined) {
            return {
                audioId:
                    cue.audioId && cue.audioId !== "none" ? cue.audioId : null,
                lastSeconds:
                    cue.lastSeconds ??
                    DEFAULT_AUDIO_CUES.countdownTick.lastSeconds,
            };
        }
    }
    return DEFAULT_AUDIO_CUES.countdownTick;
}

function resolveIntervalChime(
    layers: (AudioCues | undefined)[]
): ResolvedIntervalChime {
    for (const layer of layers) {
        const cue = layer?.intervalChime;
        if (!cue) continue;
        if (cue.audioId === "none") {
            return {
                audioId: null,
                everyMinutes:
                    cue.everyMinutes ??
                    DEFAULT_AUDIO_CUES.intervalChime.everyMinutes,
            };
        }
        if (cue.audioId || cue.everyMinutes !== undefined) {
            return {
                audioId:
                    cue.audioId && cue.audioId !== "none" ? cue.audioId : null,
                everyMinutes:
                    cue.everyMinutes ??
                    DEFAULT_AUDIO_CUES.intervalChime.everyMinutes,
            };
        }
    }
    return DEFAULT_AUDIO_CUES.intervalChime;
}

function resolvePlayDuring(
    layers: (AudioCues | undefined)[]
): ResolvedPlayDuring {
    for (const layer of layers) {
        const cue = layer?.playDuring;
        if (!cue) continue;
        if (cue.audioId === "none") {
            return { audioId: null };
        }
        if (cue.audioId) {
            return { audioId: cue.audioId };
        }
    }
    return DEFAULT_AUDIO_CUES.playDuring;
}

function resolveVideo(layers: (AudioCues | undefined)[]): ResolvedVideoCue {
    for (const layer of layers) {
        const cue = layer?.video;
        if (!cue) continue;

        if (cue.youtubeId === "none") {
            return {
                youtubeId: null,
                position: normalizeVideoPosition(cue.position),
                size: normalizeVideoSize(cue.size),
                muted: cue.muted ?? DEFAULT_AUDIO_CUES.video.muted,
            };
        }

        if (
            cue.youtubeId ||
            cue.position !== undefined ||
            cue.size !== undefined ||
            cue.muted !== undefined
        ) {
            const resolvedId =
                cue.youtubeId && cue.youtubeId !== "none"
                    ? (parseYouTubeId(cue.youtubeId) ?? cue.youtubeId)
                    : null;

            return {
                youtubeId: resolvedId,
                position: normalizeVideoPosition(
                    cue.position ?? DEFAULT_AUDIO_CUES.video.position
                ),
                size: normalizeVideoSize(
                    cue.size ?? DEFAULT_AUDIO_CUES.video.size
                ),
                muted: cue.muted ?? DEFAULT_AUDIO_CUES.video.muted,
            };
        }
    }

    return DEFAULT_AUDIO_CUES.video;
}

function resolveTimeRemaining(
    layers: (AudioCues | undefined)[]
): ResolvedTimeRemainingCue[] {
    for (const layer of layers) {
        if (layer?.timeRemaining !== undefined) {
            return layer.timeRemaining.map((rule) => ({
                audioId:
                    rule.audioId && rule.audioId !== "none"
                        ? rule.audioId
                        : null,
                secondsRemaining: rule.secondsRemaining,
                repeat: rule.repeat ?? 1,
            }));
        }
    }
    return [];
}

export function resolveAudioCues(
    ...layers: (AudioCues | undefined)[]
): ResolvedAudioCues {
    const resolved: ResolvedAudioCues = { ...DEFAULT_AUDIO_CUES };

    for (const key of SLOT_KEYS) {
        resolved[key] = resolveSlot(layers, key);
    }

    resolved.playDuring = resolvePlayDuring(layers);
    resolved.video = resolveVideo(layers);
    resolved.countdownTick = resolveCountdownTick(layers);
    resolved.intervalChime = resolveIntervalChime(layers);
    resolved.timeRemaining = resolveTimeRemaining(layers);

    return resolved;
}

export function isAudioCuesEmpty(cues: AudioCues | undefined): boolean {
    if (!cues) return true;
    return Object.keys(cues).length === 0;
}

export function stripUndefinedAudioCues(
    cues: AudioCues | undefined
): AudioCues | undefined {
    if (!cues || isAudioCuesEmpty(cues)) return undefined;

    const result: AudioCues = {};
    for (const key of SLOT_KEYS) {
        if (cues[key]) result[key] = cues[key];
    }
    if (cues.playDuring) result.playDuring = cues.playDuring;
    if (cues.video) {
        const id = cues.video.youtubeId;
        if (id === "none" || (typeof id === "string" && id.trim().length > 0)) {
            result.video = cues.video;
        }
    }
    if (cues.countdownTick) result.countdownTick = cues.countdownTick;
    if (cues.intervalChime) result.intervalChime = cues.intervalChime;
    if (cues.timeRemaining && cues.timeRemaining.length > 0) {
        result.timeRemaining = cues.timeRemaining;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
