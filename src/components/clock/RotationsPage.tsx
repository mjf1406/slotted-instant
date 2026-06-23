import { useState } from "react";
import { db } from "@/lib/db";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateRotationDialog } from "@/components/clock/CreateRotationDialog";
import { DeleteConfirmDialog } from "@/components/clock/DeleteConfirmDialog";
import { formatDuration } from "@/lib/timer-utils";
import type { Rotation } from "@/lib/types";
import { useRotations } from "@/hooks/use-clock-queries";

export function RotationsPage() {
    const user = db.useUser();
    const { data, isLoading } = useRotations(user?.id);
    const rotations = (data?.rotations ?? []) as Rotation[];
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<Rotation | null>(
        null
    );
    const [deletingRotation, setDeletingRotation] =
        useState<Rotation | null>(null);

    return (
        <div className="mx-auto w-full max-w-5xl p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">Rotations</h1>
                <Button
                    onClick={() => {
                        setEditingRotation(null);
                        setDialogOpen(true);
                    }}
                >
                    <Plus />
                    Create Rotation
                </Button>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground">Loading rotations...</p>
            ) : rotations.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">No rotations yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {rotations.map((rotation) => (
                        <div
                            key={rotation.id}
                            className="rounded-xl border p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="font-medium">
                                        {rotation.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {rotation.numberOfRotations} rotations
                                        ×{" "}
                                        {formatDuration(
                                            rotation.rotationsDurationSeconds
                                        )}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm">
                                            <MoreHorizontal />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setEditingRotation(rotation);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Pencil />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setDeletingRotation(rotation)
                                            }
                                        >
                                            <Trash2 />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateRotationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                rotation={editingRotation}
            />

            <DeleteConfirmDialog
                open={deletingRotation !== null}
                onOpenChange={(open) => !open && setDeletingRotation(null)}
                itemName={deletingRotation?.name ?? ""}
                onConfirm={async () => {
                    if (deletingRotation) {
                        await db.transact(
                            db.tx.rotations[deletingRotation.id].delete()
                        );
                    }
                }}
            />
        </div>
    );
}
