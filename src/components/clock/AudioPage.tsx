import { useRef, useState } from "react";
import { db } from "@/lib/db";
import {
    ExternalLink,
    Music,
    Pause,
    Play,
    Trash2,
    Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/clock/DeleteConfirmDialog";
import { createAudioUrlMap, useAudioPlayer } from "@/lib/audio-engine";
import {
    DEFAULT_BUILTIN_AUDIO,
    builtinAudioId,
} from "@/lib/default-audio";
import { uploadAudioFile, deleteAudioFile } from "@/lib/audio-upload";
import {
    getUserAudioOptions,
    toAudioUrlList,
    useAudioFiles,
} from "@/hooks/use-clock-queries";

export function AudioPage() {
    const user = db.useUser();
    const { data, isLoading } = useAudioFiles(user?.id);
    const audioFiles = data?.audioFiles ?? [];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletingName, setDeletingName] = useState("");

    const urlMap = createAudioUrlMap(toAudioUrlList(audioFiles));
    const { preview, togglePreview, previewPlayingId } = useAudioPlayer(urlMap);

    const userFiles = getUserAudioOptions(audioFiles);

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || !user?.id) return;
        setIsUploading(true);
        setUploadError(null);
        try {
            for (const file of Array.from(fileList)) {
                await uploadAudioFile(user.id, file);
            }
        } catch (error) {
            setUploadError(
                error instanceof Error ? error.message : "Upload failed."
            );
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Audio</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Built-in sounds and your uploads for timer cues.
                    </p>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        multiple
                        className="hidden"
                        onChange={(e) => void handleUpload(e.target.files)}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Upload />
                        {isUploading ? "Uploading..." : "Upload audio"}
                    </Button>
                </div>
            </div>

            {uploadError && (
                <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {uploadError}
                </p>
            )}

            {isLoading ? (
                <p className="text-muted-foreground">Loading audio files...</p>
            ) : (
                <div className="grid gap-8">
                    <section className="grid gap-3">
                        <h2 className="text-lg font-medium">Built-in sounds</h2>
                        <div className="grid gap-3">
                            {DEFAULT_BUILTIN_AUDIO.map((entry) => {
                                const id = builtinAudioId(entry.key);
                                const isPlaying = previewPlayingId === id;
                                return (
                                    <div
                                        key={entry.key}
                                        className="flex items-center justify-between gap-4 rounded-xl border p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {entry.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Built-in
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            onClick={() => togglePreview(id)}
                                        >
                                            {isPlaying ? <Pause /> : <Play />}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="grid gap-3">
                        <h2 className="text-lg font-medium">Your uploads</h2>
                        {userFiles.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-8 text-center">
                                <Music className="mx-auto mb-3 size-8 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    No uploads yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {audioFiles
                                    .filter((f) => !f.isBuiltin)
                                    .map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center justify-between gap-4 rounded-xl border p-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(
                                                        file.size / 1024
                                                    ).toFixed(1)}{" "}
                                                    KB
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() =>
                                                        preview(file.id)
                                                    }
                                                >
                                                    <Play />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    onClick={() => {
                                                        setDeletingId(file.id);
                                                        setDeletingName(
                                                            file.name
                                                        );
                                                    }}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </section>

                    <section className="grid gap-3 rounded-xl border border-dashed p-6">
                        <h2 className="text-lg font-medium">
                            Where to find audio
                        </h2>
                        <a
                            href="https://pixabay.com/sound-effects/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm hover:bg-muted/50"
                        >
                            Pixabay Sound Effects
                            <ExternalLink className="size-4" />
                        </a>
                    </section>
                </div>
            )}

            <DeleteConfirmDialog
                open={deletingId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingId(null);
                        setDeletingName("");
                    }
                }}
                itemName={deletingName}
                onConfirm={async () => {
                    if (deletingId) {
                        const file = audioFiles.find(
                            (f) => f.id === deletingId
                        );
                        await deleteAudioFile(
                            deletingId,
                            file?.file?.id
                        );
                    }
                }}
            />
        </div>
    );
}
