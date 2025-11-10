/** @format */

"use client";

import * as React from "react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import { useSettings } from "@/lib/settings-context";
import type { Class } from "@/lib/types";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { CreateClassModal } from "@/components/classes";
import { getYearAndWeekNumber, getWeekStart } from "@/components/timetables/utils";
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

function ClassItem({ classItem, isInCurrentView }: { classItem: Class; isInCurrentView?: boolean }) {
    const [editModalOpen, setEditModalOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <>
            <SidebarMenuItem>
                <div
                    className={`flex items-center w-full group rounded-md ${
                        isInCurrentView ? "opacity-50" : ""
                    }`}
                    style={{
                        backgroundColor: classItem.bgColor || "#ffffff",
                        color: classItem.textColor || "#000000",
                    }}
                >
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        {isCollapsed ? (
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    className="flex-1"
                                    tooltip={classItem.name}
                                    style={{
                                        backgroundColor: "transparent",
                                        color: classItem.textColor || "#000000",
                                    }}
                                >
                                    {classItem.iconName ? (
                                        <Icon
                                            name={classItem.iconName as IconName}
                                            className="size-4 shrink-0"
                                            style={{ color: classItem.textColor || "#000000" }}
                                        />
                                    ) : (
                                        <div
                                            className="size-2 rounded-full"
                                            style={{ backgroundColor: classItem.bgColor || "#6b7280" }}
                                        />
                                    )}
                                    <span className="truncate">{classItem.name}</span>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                        ) : (
                            <>
                                <SidebarMenuButton
                                    className="flex-1"
                                    tooltip={classItem.name}
                                    style={{
                                        backgroundColor: "transparent",
                                        color: classItem.textColor || "#000000",
                                    }}
                                >
                                    {classItem.iconName ? (
                                        <Icon
                                            name={classItem.iconName as IconName}
                                            className="size-4 shrink-0"
                                            style={{ color: classItem.textColor || "#000000" }}
                                        />
                                    ) : (
                                        <div
                                            className="size-2 rounded-full"
                                            style={{ backgroundColor: classItem.bgColor || "#6b7280" }}
                                        />
                                    )}
                                    <span className="truncate">{classItem.name}</span>
                                </SidebarMenuButton>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="Class actions"
                                        style={{
                                            color: classItem.textColor || "#000000",
                                        }}
                                    >
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </>
                        )}
                        <DropdownMenuContent align={isCollapsed ? "start" : "end"} side={isCollapsed ? "right" : "bottom"}>
                            {isCollapsed && (
                                <>
                                    <DropdownMenuLabel
                                        className="flex items-center gap-2 rounded-md"
                                        style={{
                                            backgroundColor: classItem.bgColor || "#ffffff",
                                            color: classItem.textColor || "#000000",
                                        }}
                                    >
                                        {classItem.iconName ? (
                                            <Icon
                                                name={classItem.iconName as IconName}
                                                className="size-4 shrink-0"
                                                style={{ color: classItem.textColor || "#000000" }}
                                            />
                                        ) : (
                                            <div
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: classItem.bgColor || "#6b7280" }}
                                            />
                                        )}
                                        <span className="truncate">{classItem.name}</span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditModalOpen(true);
                                    setDropdownOpen(false);
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
                                    setDropdownOpen(false);
                                }}
                                variant="destructive"
                                className="gap-2"
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

// Types for query results
type ClassesQueryResult = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: Record<string, never>;
        timetable: Record<string, never>;
        linkedClass: Record<string, never>;
        linkedClasses: Record<string, never>;
    }
>;

type SlotClassesQueryResult = InstaQLEntity<
    AppSchema,
    "slotClasses",
    {
        class: Record<string, never>;
    }
>;

function NavClassesContent() {
    const user = db.useUser();
    const { selectedTimetable } = useTimetable();
    const { settings } = useSettings();
    const [createModalOpen, setCreateModalOpen] = React.useState(false);
    const { state } = useSidebar();

    // Get current week for filtering slotClasses
    const currentDate = new Date();
    const weekStart = getWeekStart(currentDate, settings.weekStartDay);
    const { year, weekNumber } = getYearAndWeekNumber(weekStart);

    const { data, isLoading } = db.useQuery(
        user?.id && selectedTimetable
            ? {
                  classes: {
                      $: {
                          where: {
                              "owner.id": user.id,
                              "timetable.id": selectedTimetable.id,
                          } as Record<string, unknown>,
                      },
                      owner: {},
                      timetable: {},
                      linkedClass: {},
                      linkedClasses: {},
                  },
                  slotClasses: {
                      $: {
                          where: {
                              "timetable.id": selectedTimetable.id,
                              year: year,
                              weekNumber: weekNumber,
                              hidden: { $ne: true },
                          } as Record<string, unknown>,
                      },
                      class: {},
                  },
              }
            : {}
    );

    const classes = React.useMemo(
        () => (data?.classes || []) as ClassesQueryResult[],
        [data?.classes]
    );

    // Get class IDs that are in the current view
    const classesInCurrentView = React.useMemo(() => {
        const slotClasses = (data?.slotClasses || []) as SlotClassesQueryResult[];
        const classIds = new Set(
            slotClasses
                .map((sc) => sc.class?.id)
                .filter(Boolean) as string[]
        );
        return classIds;
    }, [data?.slotClasses]);

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
                                classItem={classItem as Class}
                                isInCurrentView={classesInCurrentView.has(classItem.id)}
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

