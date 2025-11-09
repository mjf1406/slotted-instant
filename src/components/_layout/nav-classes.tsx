/** @format */

"use client";

import * as React from "react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import type { Class } from "@/lib/types";
import { CreateClassModal } from "@/components/classes";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ResponsiveAlertDialog from "@/components/ui/responsive-alert-dialog";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon-picker";

function DeleteClassDialog({
    classItem,
    open,
    onOpenChange,
}: {
    classItem: { id: string; name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!classItem) return;

        setIsDeleting(true);
        try {
            await db.transact(db.tx.classes[classItem.id].delete());
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting class:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!classItem) {
        return null;
    }

    return (
        <ResponsiveAlertDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Delete Class"
            description={`Are you sure you want to delete "${classItem.name}"? This action cannot be undone.`}
            cancelText="Cancel"
            actionText={isDeleting ? "Deleting..." : "Delete"}
            onCancel={() => onOpenChange(false)}
            onAction={handleDelete}
            actionVariant="destructive"
            disabled={isDeleting}
        />
    );
}

function ClassItem({ classItem }: { classItem: Class }) {
    const [editModalOpen, setEditModalOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const { state } = useSidebar();

    return (
        <>
            <SidebarMenuItem>
                <div className="flex items-center w-full group">
                    <SidebarMenuButton
                        className="flex-1"
                        tooltip={classItem.name}
                    >
                        {classItem.iconName ? (
                            <Icon
                                name={classItem.iconName as IconName}
                                className="size-4 shrink-0"
                                style={{ color: classItem.color }}
                            />
                        ) : (
                            <div
                                className="size-2 rounded-full"
                                style={{ backgroundColor: classItem.color }}
                            />
                        )}
                        <span className="truncate">{classItem.name}</span>
                    </SidebarMenuButton>
                    {state !== "collapsed" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 h-auto text-muted-foreground hover:text-foreground"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Class actions"
                                >
                                    <MoreHorizontal className="size-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditModalOpen(true);
                                    }}
                                    className="gap-2"
                                >
                                    <Edit className="size-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialogOpen(true);
                                    }}
                                    variant="destructive"
                                    className="gap-2"
                                >
                                    <Trash2 className="size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </SidebarMenuItem>

            <CreateClassModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                }}
                classItem={classItem}
            />

            <DeleteClassDialog
                classItem={
                    deleteDialogOpen
                        ? { id: classItem.id, name: classItem.name }
                        : null
                }
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                }}
            />
        </>
    );
}

function NavClassesContent() {
    const user = db.useUser();
    const { selectedTimetable } = useTimetable();
    const [createModalOpen, setCreateModalOpen] = React.useState(false);
    const { state } = useSidebar();

    const { data, isLoading } = db.useQuery(
        user?.id && selectedTimetable
            ? {
                  classes: {
                      $: {
                          where: {
                              "owner.id": user.id,
                              "timetable.id": selectedTimetable.id,
                          },
                      },
                      owner: {},
                      timetable: {},
                      linkedClass: {},
                      linkedClasses: {},
                      slotClasses: {},
                  },
              }
            : {}
    );

    const classes = data?.classes || [];

    if (isLoading) {
        return (
            <SidebarGroup>
                <div className="flex items-center justify-between px-2 py-1.5">
                    <SidebarGroupLabel>Classes</SidebarGroupLabel>
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            Loading...
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    if (!selectedTimetable) {
        return (
            <SidebarGroup>
                <div className="flex items-center justify-between px-2 py-1.5">
                    <SidebarGroupLabel>Classes</SidebarGroupLabel>
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            Select a timetable
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <>
            <SidebarGroup>
                <div className="flex items-center justify-between px-2 py-1.5">
                    <SidebarGroupLabel>Classes</SidebarGroupLabel>
                    {state !== "collapsed" && (
                        <CreateClassModal
                            open={createModalOpen}
                            onOpenChange={setCreateModalOpen}
                            trigger={
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Create class"
                                >
                                    <Plus className="size-4" />
                                </button>
                            }
                        />
                    )}
                </div>
                {classes.length === 0 ? (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <CreateClassModal
                                open={createModalOpen}
                                onOpenChange={setCreateModalOpen}
                                trigger={
                                    <SidebarMenuButton className="w-full">
                                        <Plus className="size-4 mr-2" />
                                        Create Class
                                    </SidebarMenuButton>
                                }
                            />
                        </SidebarMenuItem>
                    </SidebarMenu>
                ) : (
                    <SidebarMenu>
                        {classes.map((classItem) => (
                            <ClassItem
                                key={classItem.id}
                                classItem={classItem}
                            />
                        ))}
                    </SidebarMenu>
                )}
            </SidebarGroup>
        </>
    );
}

export function NavClasses() {
    return (
        <>
            <db.SignedIn>
                <NavClassesContent />
            </db.SignedIn>
            <db.SignedOut>
                <SidebarGroup>
                    <SidebarGroupLabel>Classes</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton disabled>
                                Sign in to view classes
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </db.SignedOut>
        </>
    );
}

