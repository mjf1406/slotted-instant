/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateTimeSlot } from "./useCreateTimeSlot";
import type { SlotEntity } from "@/lib/types";

interface CreateTimeSlotDialogContentProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    slot?: SlotEntity | null;
}

export function CreateTimeSlotDialogContent({
    isOpen,
    setIsOpen,
    trigger,
    slot,
}: CreateTimeSlotDialogContentProps) {
    const {
        formData,
        errors,
        isLoading,
        days,
        timetables,
        disabledAlways,
        disabledThisWeek,
        handleDayToggle,
        handleTimeChange,
        handleTimetableChange,
        handleDisabledAlwaysChange,
        handleDisabledThisWeekChange,
        handleSubmit,
    } = useCreateTimeSlot(isOpen, slot);

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
            title={slot ? "Edit Time Slot" : "Create New Slot(s)"}
            contentClassName="sm:max-w-[425px]"
        >
            <form
                onSubmit={onSubmit}
                className="space-y-4"
            >
                <div className="space-y-2">
                    <label
                        htmlFor="timetable"
                        className="text-sm font-medium"
                    >
                        Timetable
                    </label>
                    <Select
                        value={formData.timetableId}
                        onValueChange={handleTimetableChange}
                        disabled={!!slot || isLoading}
                    >
                        <SelectTrigger
                            id="timetable"
                            className="w-full"
                            disabled={!!slot || isLoading}
                        >
                            <SelectValue placeholder="Select a timetable" />
                        </SelectTrigger>
                        <SelectContent>
                            {timetables.length === 0 ? (
                                <SelectItem
                                    value=""
                                    disabled
                                >
                                    No timetables available
                                </SelectItem>
                            ) : (
                                timetables.map((timetable) => (
                                    <SelectItem
                                        key={timetable.id}
                                        value={timetable.id}
                                    >
                                        {timetable.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors.timetableId && (
                        <p className="text-sm text-destructive">
                            {errors.timetableId}
                        </p>
                    )}
                </div>

                {!slot && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Days</label>
                        <div className="flex flex-wrap gap-2">
                            {days.map((day) => (
                                <div
                                    key={day}
                                    className="flex items-center space-x-2 rounded-md border p-2"
                                >
                                    <Checkbox
                                        id={`day-${day}`}
                                        checked={formData.days.includes(day)}
                                        onCheckedChange={() =>
                                            handleDayToggle(day)
                                        }
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
                )}

                <div className="space-y-2">
                    <div className="flex flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <label
                                htmlFor="start_time"
                                className="text-sm font-medium"
                            >
                                Start Time
                            </label>
                            <Input
                                id="start_time"
                                type="time"
                                value={formData.start_time}
                                onChange={(e) =>
                                    handleTimeChange("start_time", e.target.value)
                                }
                            />
                            {errors.start_time && (
                                <p className="text-sm text-destructive">
                                    {errors.start_time}
                                </p>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <label
                                htmlFor="end_time"
                                className="text-sm font-medium"
                            >
                                End Time
                            </label>
                            <Input
                                id="end_time"
                                type="time"
                                value={formData.end_time}
                                onChange={(e) =>
                                    handleTimeChange("end_time", e.target.value)
                                }
                            />
                            {errors.end_time && (
                                <p className="text-sm text-destructive">
                                    {errors.end_time}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Disable Options</label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 rounded-md border p-2">
                            <Checkbox
                                id="disabled-always"
                                checked={disabledAlways}
                                onCheckedChange={handleDisabledAlwaysChange}
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="disabled-always"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Always disabled
                            </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-2">
                            <Checkbox
                                id="disabled-week"
                                checked={disabledThisWeek}
                                onCheckedChange={handleDisabledThisWeekChange}
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="disabled-week"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Disabled for this week only
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {slot ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            slot ? "Update Slot" : "Create Slot(s)"
                        )}
                    </Button>
                </div>
            </form>
        </ResponsiveDialog>
    );
}
