/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { useTimetable } from "@/lib/timetable-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

const WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

interface FormErrors {
    name?: string;
    days?: string;
    startTime?: string;
    endTime?: string;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

interface CreateTimetableModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    timetable?: { id: string; name: string; days: string[]; startTime: number; endTime: number } | null;
}

export function CreateTimetableModal({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
    timetable,
}: CreateTimetableModalProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen =
        controlledOnOpenChange !== undefined
            ? controlledOnOpenChange
            : setInternalOpen;
    const isControlled = controlledOpen !== undefined;

    return (
        <CreateTimetableModalContent
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={trigger}
            isControlled={isControlled}
            timetable={timetable}
        />
    );
}

function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function CreateTimetableModalContent({
    isOpen,
    setIsOpen,
    trigger,
    isControlled,
    timetable,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    isControlled: boolean;
    timetable?: { id: string; name: string; days: string[]; startTime: number; endTime: number } | null;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const { setSelectedTimetable, timetables } = useTimetable();
    const user = db.useUser();
    const isEditMode = !!timetable;

    const [formData, setFormData] = useState({
        name: "",
        days: [] as string[],
        startTime: "09:00",
        endTime: "17:00",
    });

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (formData.days.length === 0) {
            newErrors.days = "Select at least one day";
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formData.startTime)) {
            newErrors.startTime = "Invalid time format";
        }

        if (!timeRegex.test(formData.endTime)) {
            newErrors.endTime = "Invalid time format";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        const startMinutes = timeToMinutes(formData.startTime);
        const endMinutes = timeToMinutes(formData.endTime);

        if (startMinutes >= endMinutes) {
            newErrors.endTime = "End time must be after start time";
            setErrors(newErrors);
            return false;
        }

        setErrors({});
        return true;
    };

    // Initialize form data when timetable changes or modal opens
    useEffect(() => {
        if (isOpen && timetable) {
            setFormData({
                name: timetable.name,
                days: timetable.days || [],
                startTime: minutesToTime(timetable.startTime),
                endTime: minutesToTime(timetable.endTime),
            });
        } else if (isOpen && !timetable) {
            setFormData({
                name: "",
                days: [],
                startTime: "09:00",
                endTime: "17:00",
            });
        }
    }, [isOpen, timetable]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const startMinutes = timeToMinutes(formData.startTime);
            const endMinutes = timeToMinutes(formData.endTime);

            if (isEditMode && timetable) {
                // Update existing timetable
                await db.transact(
                    db.tx.timetables[timetable.id].update({
                        name: formData.name.trim(),
                        days: formData.days,
                        startTime: startMinutes,
                        endTime: endMinutes,
                    })
                );
            } else {
                // Create new timetable
                const timetableId = id();
                await db.transact(
                    db.tx.timetables[timetableId]
                        .update({
                            name: formData.name.trim(),
                            days: formData.days,
                            startTime: startMinutes,
                            endTime: endMinutes,
                        })
                        .link({ owner: user.id })
                );
            }

            // Reset form
            setFormData({
                name: "",
                days: [],
                startTime: "09:00",
                endTime: "17:00",
            });
            setErrors({});
            setIsOpen(false);

            // The timetable will be automatically selected by the context
            // when it loads from the query
        } catch (error) {
            console.error(`Error ${isEditMode ? "updating" : "creating"} timetable:`, error);
            setErrors({
                name: `Failed to ${isEditMode ? "update" : "create"} timetable. Please try again.`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDayToggle = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter((d) => d !== day)
                : [...prev.days, day],
        }));
        // Clear days error when user selects a day
        if (errors.days) {
            setErrors((prev) => ({ ...prev, days: undefined }));
        }
    };

    // Reset form when modal closes (only if not in edit mode)
    useEffect(() => {
        if (!isOpen && !isEditMode) {
            setFormData({
                name: "",
                days: [],
                startTime: "09:00",
                endTime: "17:00",
            });
            setErrors({});
        }
    }, [isOpen, isEditMode]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button variant="default" onClick={() => setIsOpen(true)}>
                        <Plus size={20} className="mr-2" /> Create Timetable
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Timetable" : "Create New Timetable"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Update the name, days, and times for your timetable."
                            : "Enter a name, select days, and set start and end times for your timetable."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }));
                                if (errors.name) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        name: undefined,
                                    }));
                                }
                            }}
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Days of the Week
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Select the days to include in your timetable.
                        </p>
                        <div className="space-y-2">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="flex items-center space-x-2"
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

                    <div className="space-y-2">
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
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    startTime: e.target.value,
                                }));
                                if (errors.startTime) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        startTime: undefined,
                                    }));
                                }
                            }}
                            aria-invalid={!!errors.startTime}
                        />
                        {errors.startTime && (
                            <p className="text-sm text-destructive">
                                {errors.startTime}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
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
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    endTime: e.target.value,
                                }));
                                if (errors.endTime) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        endTime: undefined,
                                    }));
                                }
                            }}
                            aria-invalid={!!errors.endTime}
                        />
                        {errors.endTime && (
                            <p className="text-sm text-destructive">
                                {errors.endTime}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                                </>
                            ) : (
                                isEditMode ? "Update Timetable" : "Create Timetable"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

