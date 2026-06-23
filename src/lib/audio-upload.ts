import { id } from "@instantdb/react";
import { db } from "@/lib/db";

export async function uploadAudioFile(
    userId: string,
    file: File
): Promise<void> {
    if (!file.type.startsWith("audio/")) {
        throw new Error(`${file.name} is not an audio file`);
    }

    const path = `audio/${userId}/${Date.now()}-${file.name}`;
    const { data } = await db.storage.uploadFile(path, file);
    const audioId = id();

    await db.transact(
        db.tx.audioFiles[audioId]
            .update({
                name: file.name.replace(/\.[^.]+$/, "") || "Untitled",
                contentType: file.type,
                size: file.size,
                isBuiltin: false,
            })
            .link({ owner: userId, file: data.id })
    );
}

export async function deleteAudioFile(
    audioFileId: string,
    fileId?: string
): Promise<void> {
    await db.transact(db.tx.audioFiles[audioFileId].delete());
    if (fileId) {
        await db.transact(db.tx.$files[fileId].delete());
    }
}
