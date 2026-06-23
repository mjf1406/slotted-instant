import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { ActiveSession } from "@/lib/active-session";
import {
    advanceSegment,
    resolveSegmentDuration,
    serializeSession,
} from "@/lib/active-session";

export type DisplaySessionUpdate = {
    sessionJson?: ActiveSession | null;
    endsAt?: number | null;
    paused?: boolean;
    pausedRemainingMs?: number | null;
    pushedSlotClassId?: string | null;
    pushedUntil?: number | null;
    clearPushedSlotClass?: boolean;
};

export function isPushOverrideActive(
    pushedUntil: number | null | undefined,
    now = Date.now()
): boolean {
    if (pushedUntil == null) return false;
    return pushedUntil > now;
}

export async function ensureDisplaySession(userId: string): Promise<string> {
    const { data } = await db.queryOnce({
        displaySessions: {
            $: { where: { "owner.id": userId } },
        },
    });

    const existing = data.displaySessions?.[0];
    if (existing) return existing.id;

    const sessionId = id();
    await db.transact(
        db.tx.displaySessions[sessionId]
            .update({
                paused: false,
                updatedAt: Date.now(),
            })
            .link({ owner: userId })
    );
    return sessionId;
}

export async function updateDisplaySession(
    sessionId: string,
    update: DisplaySessionUpdate
): Promise<void> {
    const payload: Record<string, unknown> = {
        updatedAt: Date.now(),
    };

    if (update.sessionJson !== undefined) {
        payload.sessionJson =
            update.sessionJson === null
                ? null
                : serializeSession(update.sessionJson);
    }
    if (update.endsAt !== undefined) {
        payload.endsAt = update.endsAt;
    }
    if (update.paused !== undefined) {
        payload.paused = update.paused;
    }
    if (update.pausedRemainingMs !== undefined) {
        payload.pausedRemainingMs = update.pausedRemainingMs;
    }
    if (update.pushedUntil !== undefined) {
        payload.pushedUntil = update.pushedUntil;
    }

    const txs = [db.tx.displaySessions[sessionId].update(payload)];

    if (update.pushedSlotClassId) {
        txs.push(
            db.tx.displaySessions[sessionId].link({
                pushedSlotClass: update.pushedSlotClassId,
            })
        );
    }

    if (update.clearPushedSlotClass && update.pushedSlotClassId) {
        txs.push(
            db.tx.displaySessions[sessionId].unlink({
                pushedSlotClass: update.pushedSlotClassId,
            })
        );
    }

    await db.transact(txs);
}

export async function pushSlotClassToDisplay(
    userId: string,
    slotClassId: string,
    durationSeconds: number
): Promise<void> {
    const sessionId = await ensureDisplaySession(userId);
    await updateDisplaySession(sessionId, {
        pushedSlotClassId: slotClassId,
        pushedUntil: Date.now() + durationSeconds * 1000,
    });
}

export async function clearPushedSlotClass(userId: string): Promise<void> {
    const { data } = await db.queryOnce({
        displaySessions: {
            $: { where: { "owner.id": userId } },
            pushedSlotClass: {},
        },
    });

    const session = data.displaySessions?.[0];
    if (!session) return;

    const pushedId = session.pushedSlotClass?.id;
    if (!pushedId) {
        if (session.pushedUntil != null) {
            await db.transact(
                db.tx.displaySessions[session.id].update({
                    pushedUntil: null,
                    updatedAt: Date.now(),
                })
            );
        }
        return;
    }

    await updateDisplaySession(session.id, {
        pushedUntil: null,
        pushedSlotClassId: pushedId,
        clearPushedSlotClass: true,
    });
}

export async function startDisplaySession(
    userId: string,
    session: ActiveSession
): Promise<void> {
    const sessionId = await ensureDisplaySession(userId);
    const duration = resolveSegmentDuration(session.segments[session.index]!);
    await updateDisplaySession(sessionId, {
        sessionJson: session,
        endsAt: Date.now() + duration * 1000,
        paused: false,
        pausedRemainingMs: null,
    });
}

export async function stopDisplaySession(userId: string): Promise<void> {
    const sessionId = await ensureDisplaySession(userId);
    await updateDisplaySession(sessionId, {
        sessionJson: null,
        endsAt: null,
        paused: false,
        pausedRemainingMs: null,
    });
}

export async function pauseDisplaySession(
    userId: string,
    remainingMs: number
): Promise<void> {
    const sessionId = await ensureDisplaySession(userId);
    await updateDisplaySession(sessionId, {
        paused: true,
        pausedRemainingMs: remainingMs,
        endsAt: null,
    });
}

export async function resumeDisplaySession(
    userId: string,
    remainingMs: number
): Promise<void> {
    const sessionId = await ensureDisplaySession(userId);
    await updateDisplaySession(sessionId, {
        paused: false,
        pausedRemainingMs: null,
        endsAt: Date.now() + remainingMs,
    });
}

export async function adjustDisplaySession(
    userId: string,
    deltaSeconds: number,
    currentEndsAt: number | null,
    paused: boolean,
    pausedRemainingMs: number | null
): Promise<void> {
    const sessionId = await ensureDisplaySession(userId);

    if (paused && pausedRemainingMs !== null) {
        const nextMs = pausedRemainingMs + deltaSeconds * 1000;
        if (nextMs < 0) return;
        await updateDisplaySession(sessionId, {
            pausedRemainingMs: nextMs,
        });
        return;
    }

    if (currentEndsAt === null) return;
    const nextEndsAt = currentEndsAt + deltaSeconds * 1000;
    const nextRemaining = Math.floor((nextEndsAt - Date.now()) / 1000);
    if (nextRemaining < 0) return;

    await updateDisplaySession(sessionId, {
        endsAt: nextEndsAt,
    });
}

export async function skipDisplaySegment(
    userId: string,
    session: ActiveSession
): Promise<ActiveSession | null> {
    const sessionId = await ensureDisplaySession(userId);
    const next = advanceSegment(session);
    if (!next) {
        await updateDisplaySession(sessionId, {
            sessionJson: null,
            endsAt: null,
            paused: false,
            pausedRemainingMs: null,
        });
        return null;
    }

    const duration = resolveSegmentDuration(next.segments[next.index]!);
    await updateDisplaySession(sessionId, {
        sessionJson: next,
        endsAt: Date.now() + duration * 1000,
        paused: false,
        pausedRemainingMs: null,
    });
    return next;
}

export async function advanceDisplaySegment(
    userId: string,
    session: ActiveSession
): Promise<ActiveSession | null> {
    return skipDisplaySegment(userId, session);
}

export function remainingFromDisplaySession(
    endsAt: number | null | undefined,
    paused: boolean,
    pausedRemainingMs: number | null | undefined
): number {
    if (paused) {
        return Math.floor((pausedRemainingMs ?? 0) / 1000);
    }
    if (endsAt == null) return 0;
    return Math.floor((endsAt - Date.now()) / 1000);
}

export function formatPushOverrideRemaining(
    pushedUntil: number,
    now = Date.now()
): string {
    const secondsLeft = Math.max(0, Math.ceil((pushedUntil - now) / 1000));
    if (secondsLeft >= 60) {
        const minutes = Math.ceil(secondsLeft / 60);
        return `${minutes}m left`;
    }
    return `${secondsLeft}s left`;
}
