/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { IconPicker, Icon } from "@/components/ui/icon-picker";
import { useCreateTimetable } from "./useCreateTimetable";
import { WEEKDAYS } from "../utils";
import type { TimetableInput } from "./types";

interface CreateTimetableModalContentProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    isControlled: boolean;
    timetable?: TimetableInput | null;
}

export function CreateTimetableModalContent({
    isOpen,
    setIsOpen,
    trigger,
    isControlled,
    timetable,
}: CreateTimetableModalContentProps) {
    const {
        formData,
        errors,
        isLoading,
        isEditMode,
        availableTimetables,
        handleFieldChange,
        handleDayToggle,
        handleSubmit,
    } = useCreateTimetable(isOpen, timetable);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await handleSubmit();
        if (success) {
            setIsOpen(false);
        }
    };

    return (
        <ResponsiveDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={trigger}
            triggerIcon={
                !trigger && !isControlled ? <Plus size={20} /> : undefined
            }
            triggerText={
                !trigger && !isControlled ? "Create Timetable" : undefined
            }
            title={isEditMode ? "Edit Timetable" : "Create New Timetable"}
            description={
                isEditMode
                    ? "Update the name, days, and times for your timetable."
                    : "Enter a name, select days, and set start and end times for your timetable."
            }
            contentClassName="sm:max-w-[425px]"
        >
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label
                        htmlFor="name"
                        className="text-sm font-medium leading-none"
                    >
                        Timetable Name
                    </label>
                    <Input
                        id="name"
                        placeholder="My Weekly Schedule"
                        value={formData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">
                            {errors.name}
                        </p>
                    )}
                </div>

                {!isEditMode && (
                    <div className="space-y-2">
                        <label
                            htmlFor="sourceTimetable"
                            className="text-sm font-medium leading-none"
                        >
                            Copy Classes From
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Optionally copy all classes from an existing
                            timetable.
                        </p>
                        <Select
                            value={formData.sourceTimetableId || "none"}
                            onValueChange={(value) =>
                                handleFieldChange(
                                    "sourceTimetableId",
                                    value === "none" ? "" : value
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a time table" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Select a time table</SelectItem>
                                {availableTimetables.map((timetable) => (
                                    <SelectItem
                                        key={timetable.id}
                                        value={timetable.id}
                                    >
                                        {timetable.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">
                        Days of the Week
                    </label>
                    <p className="text-xs text-muted-foreground">
                        Select the days to include in your timetable.
                    </p>
                    <div className="flex flex-row flex-wrap gap-3">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={`day-${day}`}
                                    checked={formData.days.includes(day)}
                                    onCheckedChange={() => handleDayToggle(day)}
                                />
                                <label
                                    htmlFor={`day-${day}`}
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    {day}
                                </label>
                            </div>
                        ))}
                    </div>
                    {errors.days && (
                        <p className="text-sm text-destructive">
                            {errors.days}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <label
                                htmlFor="startTime"
                                className="text-sm font-medium leading-none"
                            >
                                Start Time
                            </label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) =>
                                    handleFieldChange("startTime", e.target.value)
                                }
                                aria-invalid={!!errors.startTime}
                            />
                            {errors.startTime && (
                                <p className="text-sm text-destructive">
                                    {errors.startTime}
                                </p>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <label
                                htmlFor="endTime"
                                className="text-sm font-medium leading-none"
                            >
                                End Time
                            </label>
                            <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) =>
                                    handleFieldChange("endTime", e.target.value)
                                }
                                aria-invalid={!!errors.endTime}
                            />
                            {errors.endTime && (
                                <p className="text-sm text-destructive">
                                    {errors.endTime}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="color"
                            className="text-sm font-medium leading-none"
                        >
                            Color
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="color"
                                type="color"
                                value={formData.color}
                                onChange={(e) =>
                                    handleFieldChange("color", e.target.value)
                                }
                                className="h-10 w-20"
                            />
                            <Input
                                type="text"
                                value={formData.color}
                                onChange={(e) =>
                                    handleFieldChange("color", e.target.value)
                                }
                                placeholder="#000000"
                            />
                        </div>
                        {errors.color && (
                            <p className="text-sm text-destructive">
                                {errors.color}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="iconName"
                            className="text-sm font-medium leading-none"
                        >
                            Icon
                        </label>
                        <IconPicker
                            value={formData.iconName || undefined}
                            onValueChange={(value) =>
                                handleFieldChange("iconName", value)
                            }
                            triggerPlaceholder="Select an icon"
                        >
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                            >
                                {formData.iconName ? (
                                    <>
                                        <Icon name={formData.iconName} />
                                        {formData.iconName}
                                    </>
                                ) : (
                                    "Select an icon"
                                )}
                            </Button>
                        </IconPicker>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>
                                    {isEditMode ? "Updating..." : "Creating..."}
                                </span>
                            </>
                        ) : (
                            isEditMode
                                ? "Update Timetable"
                                : "Create Timetable"
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </ResponsiveDialog>
    );
}

