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
import { CreateTimerDialog } from "@/components/clock/CreateTimerDialog";
import { DeleteConfirmDialog } from "@/components/clock/DeleteConfirmDialog";
import { formatDuration } from "@/lib/timer-utils";
import type { Timer } from "@/lib/types";
import { useTimers } from "@/hooks/use-clock-queries";

export function TimersPage() {
    const user = db.useUser();
    const { data, isLoading } = useTimers(user?.id);
    const timers = (data?.timers ?? []) as Timer[];
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTimer, setEditingTimer] = useState<Timer | null>(null);
    const [deletingTimer, setDeletingTimer] = useState<Timer | null>(null);

    const openCreateDialog = () => {
        setEditingTimer(null);
        setDialogOpen(true);
    };

    const openEditDialog = (timer: Timer) => {
        setEditingTimer(timer);
        setDialogOpen(true);
    };

    return (
        <div className="mx-auto w-full max-w-5xl p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">Timers</h1>
                <Button onClick={openCreateDialog}>
                    <Plus />
                    Create Timer
                </Button>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground">Loading timers...</p>
            ) : timers.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">No timers yet.</p>
                    <Button
                        className="mt-4"
                        variant="outline"
                        onClick={openCreateDialog}
                    >
                        <Plus />
                        Create your first timer
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {timers.map((timer) => (
                        <div
                            key={timer.id}
                            className="relative overflow-hidden rounded-xl ring-1 ring-foreground/10"
                        >
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{ backgroundColor: timer.bgColor }}
                            />
                            <div className="relative flex flex-col gap-3 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate font-medium">
                                            {timer.name}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {timer.endTime
                                                ? `Ends at ${timer.endTime}`
                                                : formatDuration(
                                                      timer.durationSeconds
                                                  )}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="shrink-0"
                                            >
                                                <MoreHorizontal />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openEditDialog(timer)
                                                }
                                            >
                                                <Pencil />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setDeletingTimer(timer)
                                                }
                                            >
                                                <Trash2 />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateTimerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                timer={editingTimer}
            />

            <DeleteConfirmDialog
                open={deletingTimer !== null}
                onOpenChange={(open) => !open && setDeletingTimer(null)}
                itemName={deletingTimer?.name ?? ""}
                onConfirm={async () => {
                    if (deletingTimer) {
                        await db.transact(
                            db.tx.timers[deletingTimer.id].delete()
                        );
                    }
                }}
            />
        </div>
    );
}
