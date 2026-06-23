export type VideoPosition = "top" | "bottom" | "left" | "right";
export type VideoSize = "small" | "medium" | "large";

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (YOUTUBE_ID_PATTERN.test(trimmed)) {
        return trimmed;
    }

    try {
        const url = new URL(
            trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
        );

        if (url.hostname === "youtu.be") {
            const id = url.pathname.slice(1).split("/")[0];
            return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
        }

        if (
            url.hostname.includes("youtube.com") ||
            url.hostname.includes("youtube-nocookie.com")
        ) {
            const v = url.searchParams.get("v");
            if (v && YOUTUBE_ID_PATTERN.test(v)) return v;

            const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch?.[1]) return embedMatch[1];

            const shortsMatch = url.pathname.match(
                /\/shorts\/([a-zA-Z0-9_-]{11})/
            );
            if (shortsMatch?.[1]) return shortsMatch[1];
        }
    } catch {
        return null;
    }

    return null;
}

export function buildEmbedUrl({
    id,
    muted = false,
    loop = true,
}: {
    id: string;
    muted?: boolean;
    loop?: boolean;
}): string {
    const params = new URLSearchParams({
        autoplay: "1",
        mute: muted ? "1" : "0",
        controls: "1",
        rel: "0",
        playsinline: "1",
        enablejsapi: "1",
    });

    if (loop) {
        params.set("loop", "1");
        params.set("playlist", id);
    }

    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function normalizeVideoPosition(
    position: string | undefined
): VideoPosition {
    if (
        position === "top" ||
        position === "bottom" ||
        position === "left" ||
        position === "right"
    ) {
        return position;
    }
    return "top";
}

export function normalizeVideoSize(size: string | undefined): VideoSize {
    if (size === "small" || size === "medium" || size === "large") {
        return size;
    }
    return "small";
}

export const VIDEO_SIZE_WIDTH: Record<VideoSize, number> = {
    small: 256,
    medium: 384,
    large: 512,
};
