/** @format */

"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, CalendarIcon, Edit, Trash2 } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon-picker";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import { CreateTimetableModal } from "@/components/CreateTimetableModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DeleteTimetableDialog({
    timetable,
    open,
    onOpenChange,
}: {
    timetable: { id: string; name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const { setSelectedTimetable, timetables } = useTimetable();

    const handleDelete = async () => {
        if (!timetable) return;

        setIsDeleting(true);
        try {
            await db.transact(db.tx.timetables[timetable.id].delete());

            // If we deleted the selected timetable, select another one or clear selection
            if (timetables.length > 1) {
                const remainingTimetables = timetables.filter(
                    (t) => t.id !== timetable.id
                );
                if (remainingTimetables.length > 0) {
                    setSelectedTimetable(remainingTimetables[0]);
                } else {
                    setSelectedTimetable(null);
                }
            } else {
                setSelectedTimetable(null);
            }

            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting timetable:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!timetable) {
        return null;
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Timetable</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{timetable.name}"? This
                        action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function TimetableSwitcher() {
    const { isMobile } = useSidebar();
    const { selectedTimetable, setSelectedTimetable, timetables, isLoading } =
        useTimetable();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [editModalOpen, setEditModalOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [timetableToEdit, setTimetableToEdit] = React.useState<{
        id: string;
        name: string;
        days: string[];
        startTime: number;
        endTime: number;
        color?: string;
        iconName?: string;
    } | null>(null);
    const [timetableToDelete, setTimetableToDelete] = React.useState<{
        id: string;
        name: string;
    } | null>(null);
    const [createModalOpen, setCreateModalOpen] = React.useState(false);

    const handleEdit = (timetable: (typeof timetables)[0]) => {
        setTimetableToEdit({
            id: timetable.id,
            name: timetable.name,
            days: (timetable.days as string[]) || [],
            startTime: timetable.startTime,
            endTime: timetable.endTime,
            color: (timetable as any).color,
            iconName: (timetable as any).iconName,
        });
        setEditModalOpen(true);
    };

    const handleDeleteClick = (timetable: (typeof timetables)[0]) => {
        setTimetableToDelete({
            id: timetable.id,
            name: timetable.name,
        });
        setDeleteDialogOpen(true);
    };

    const displayTimetable = selectedTimetable || timetables[0];

    if (isLoading) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size="lg"
                        disabled
                    >
                        <div
                            className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                            style={{
                                backgroundColor: displayTimetable?.color || "var(--sidebar-primary)",
                            }}
                        >
                            {displayTimetable?.iconName ? (
                                <Icon
                                    name={displayTimetable.iconName as IconName}
                                    className="size-4"
                                />
                            ) : (
                                <CalendarIcon className="size-4" />
                            )}
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">
                                Loading...
                            </span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div
                                    className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                                    style={{
                                        backgroundColor: (displayTimetable as any)?.color || "var(--sidebar-primary)",
                                    }}
                                >
                                    {(displayTimetable as any)?.iconName ? (
                                        <Icon
                                            name={(displayTimetable as any).iconName as IconName}
                                            className="size-4"
                                        />
                                    ) : (
                                        <CalendarIcon className="size-4" />
                                    )}
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {displayTimetable?.name ||
                                            "No Timetable"}
                                    </span>
                                    <span className="truncate text-xs">
                                        {timetables.length}{" "}
                                        {timetables.length === 1
                                            ? "timetable"
                                            : "timetables"}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="text-muted-foreground text-xs">
                                Timetables
                            </DropdownMenuLabel>
                            {timetables.length === 0 ? (
                                <DropdownMenuItem
                                    disabled
                                    className="gap-2 p-2"
                                >
                                    <div className="text-muted-foreground text-sm">
                                        No timetables yet
                                    </div>
                                </DropdownMenuItem>
                            ) : (
                                timetables.map((timetable) => (
                                    <DropdownMenuSub key={timetable.id}>
                                        <DropdownMenuSubTrigger
                                            className="gap-2 p-2"
                                            onClick={() => {
                                                setSelectedTimetable(timetable);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            <div
                                                className="flex size-6 items-center justify-center rounded-md border"
                                                style={{
                                                    backgroundColor: (timetable as any).color || "transparent",
                                                }}
                                            >
                                                {(timetable as any).iconName ? (
                                                    <Icon
                                                        name={(timetable as any).iconName as IconName}
                                                        className="size-3.5 shrink-0"
                                                    />
                                                ) : (
                                                    <CalendarIcon className="size-3.5 shrink-0" />
                                                )}
                                            </div>
                                            <span
                                                className={
                                                    selectedTimetable?.id ===
                                                    timetable.id
                                                        ? "font-medium"
                                                        : ""
                                                }
                                            >
                                                {timetable.name}
                                            </span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(timetable);
                                                }}
                                                className="gap-2"
                                            >
                                                <Edit className="size-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(
                                                        timetable
                                                    );
                                                }}
                                                variant="destructive"
                                                className="gap-2"
                                            >
                                                <Trash2 className="size-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                ))
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="gap-2 p-2"
                                onClick={() => {
                                    setCreateModalOpen(true);
                                    setDropdownOpen(false);
                                }}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <div className="text-muted-foreground font-medium">
                                    Create Timetable
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <CreateTimetableModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) {
                        setTimetableToEdit(null);
                    }
                }}
                timetable={timetableToEdit}
            />

            <CreateTimetableModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            />

            <DeleteTimetableDialog
                timetable={timetableToDelete}
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setTimetableToDelete(null);
                    }
                }}
            />
        </>
    );
}
