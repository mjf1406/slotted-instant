export type BuiltinAudioEntry = {
    key: string;
    name: string;
    url: string;
};

/** Built-in sounds available to all users via static URLs in /public/audio */
export const DEFAULT_BUILTIN_AUDIO: BuiltinAudioEntry[] = [
    {
        key: "jeopardy",
        name: "Jeopardy",
        url: "/audio/30s-jeopardy-song.mp3",
    },
    {
        key: "10s-calm-alarm",
        name: "10s calm alarm",
        url: "/audio/10s-calm-alarm.mp3",
    },
    {
        key: "1-minute-warning",
        name: "1 minute warning",
        url: "/audio/1-minute-warning.mp3",
    },
    {
        key: "3-minute-warning",
        name: "3 minute warning",
        url: "/audio/3-minutes-warning.mp3",
    },
    {
        key: "4s-magical-surprise",
        name: "4s magical surprise",
        url: "/audio/4s-magical-surprise.mp3",
    },
    { key: "game-over", name: "Game over", url: "/audio/game-over.mp3" },
];

export const BUILTIN_AUDIO_PREFIX = "builtin:";

export function builtinAudioId(key: string): string {
    return `${BUILTIN_AUDIO_PREFIX}${key}`;
}

export function isBuiltinAudioId(id: string): boolean {
    return id.startsWith(BUILTIN_AUDIO_PREFIX);
}

export function getBuiltinAudioUrl(id: string): string | null {
    if (!isBuiltinAudioId(id)) return null;
    const key = id.slice(BUILTIN_AUDIO_PREFIX.length);
    const entry = DEFAULT_BUILTIN_AUDIO.find((b) => b.key === key);
    return entry?.url ?? null;
}

export const BUILTIN_AUDIO_MAP = new Map(
    DEFAULT_BUILTIN_AUDIO.map((entry) => [builtinAudioId(entry.key), entry.url])
);
