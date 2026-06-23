import { db } from "@/lib/db";
import {
    DEFAULT_BUILTIN_AUDIO,
    builtinAudioId,
} from "@/lib/default-audio";
import type { AudioFileOption } from "@/components/clock/AudioCueSelect";
import type { AudioFileWithUrl } from "@/lib/audio-engine";

export function useClockSettings(userId: string | undefined) {
    return db.useQuery(
        userId
            ? {
                  clockSettings: {
                      $: { where: { "owner.id": userId } },
                  },
              }
            : {}
    );
}

export function useTimers(userId: string | undefined) {
    return db.useQuery(
        userId
            ? {
                  timers: {
                      $: { where: { "owner.id": userId } },
                      nextTimer: {},
                  },
              }
            : {}
    );
}

export function useRotations(userId: string | undefined) {
    return db.useQuery(
        userId
            ? {
                  rotations: {
                      $: { where: { "owner.id": userId } },
                  },
              }
            : {}
    );
}

export function useAudioFiles(userId: string | undefined) {
    return db.useQuery(
        userId
            ? {
                  audioFiles: {
                      $: { where: { "owner.id": userId } },
                      file: {},
                  },
              }
            : {}
    );
}

export function useDisplaySession(userId: string | undefined) {
    return db.useQuery(
        userId
            ? {
                  displaySessions: {
                      $: { where: { "owner.id": userId } },
                      pushedSlotClass: {
                          class: {},
                          slot: {},
                          timetable: {},
                      },
                  },
              }
            : {}
    );
}

export function getBuiltinAudioOptions(): AudioFileOption[] {
    return DEFAULT_BUILTIN_AUDIO.map((entry) => ({
        id: builtinAudioId(entry.key),
        name: entry.name,
        isBuiltin: true,
    }));
}

export function getUserAudioOptions(
    audioFiles: Array<{ id: string; name: string; isBuiltin?: boolean }>
): AudioFileOption[] {
    return audioFiles
        .filter((f) => !f.isBuiltin)
        .map((f) => ({ id: f.id, name: f.name, isBuiltin: false }));
}

export function getAllAudioOptions(
    audioFiles: Array<{ id: string; name: string; isBuiltin?: boolean }>
): AudioFileOption[] {
    return [...getBuiltinAudioOptions(), ...getUserAudioOptions(audioFiles)];
}

export function toAudioUrlList(
    audioFiles: Array<{
        id: string;
        file?: { url?: string } | null;
    }>
): AudioFileWithUrl[] {
    return audioFiles.map((f) => ({
        id: f.id,
        url: f.file?.url ?? null,
    }));
}
