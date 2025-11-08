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
    DialogFooter,
} from "@/components/ui/dialog";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { Loader2, Plus } from "lucide-react";
import { IconPicker, Icon, type IconName } from "@/components/ui/icon-picker";
import type { Class } from "@/lib/types";

interface FormErrors {
    name?: string;
    color?: string;
    iconName?: string;
}

function getYearAndWeekNumber(date: Date): {
    year: number;
    weekNumber: number;
} {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return { year: d.getUTCFullYear(), weekNumber };
}

interface CreateClassModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    classItem?: Class | null;
}

export function CreateClassModalContent({
    isOpen,
    setIsOpen,
    trigger,
    isControlled,
    classItem,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    isControlled: boolean;
    classItem?: Class | null;
}) {
    return (
        <db.SignedIn>
            <CreateClassModalContentInner
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                trigger={trigger}
                isControlled={isControlled}
                classItem={classItem}
            />
        </db.SignedIn>
    );
}

export function CreateClassModal({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
    classItem,
}: CreateClassModalProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen =
        controlledOnOpenChange !== undefined
            ? controlledOnOpenChange
            : setInternalOpen;
    const isControlled = controlledOpen !== undefined;

    return (
        <CreateClassModalContent
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={trigger}
            isControlled={isControlled}
            classItem={classItem}
        />
    );
}

function CreateClassModalContentInner({
    isOpen,
    setIsOpen,
    trigger,
    isControlled,
    classItem,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    isControlled: boolean;
    classItem?: Class | null;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const { selectedTimetable } = useTimetable();
    const user = db.useUser();
    const isEditMode = !!classItem;

    const currentDate = new Date();
    const { year, weekNumber } = getYearAndWeekNumber(currentDate);

    const [formData, setFormData] = useState({
        name: "",
        color: "#000000",
        iconName: "" as IconName | "",
        includeWeekInfo: false,
    });

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.color.trim()) {
            newErrors.color = "Color is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        setErrors({});
        return true;
    };

    // Initialize form data when class changes or modal opens
    useEffect(() => {
        if (isOpen && classItem) {
            setFormData({
                name: classItem.name,
                color: classItem.color,
                iconName: (classItem.iconName as IconName) || "",
                includeWeekInfo: !!(classItem.weekNumber && classItem.year),
            });
        } else if (isOpen && !classItem) {
            setFormData({
                name: "",
                color: "#000000",
                iconName: "",
                includeWeekInfo: false,
            });
        }
    }, [isOpen, classItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!selectedTimetable || !user?.id) {
            setErrors({
                name: "Please select a timetable first",
            });
            return;
        }

        setIsLoading(true);

        try {
            if (isEditMode && classItem) {
                // Update existing class
                await db.transact(
                    db.tx.classes[classItem.id].update({
                        name: formData.name.trim(),
                        color: formData.color,
                        iconName: formData.iconName || "",
                        iconPrefix: "fas", // Keep for backward compatibility
                        weekNumber: formData.includeWeekInfo
                            ? weekNumber
                            : null,
                        year: formData.includeWeekInfo ? year : null,
                    })
                );
            } else {
                // Create new class
                const classId = id();
                await db.transact(
                    db.tx.classes[classId]
                        .update({
                            name: formData.name.trim(),
                            color: formData.color,
                            iconName: formData.iconName || "",
                            iconPrefix: "fas", // Keep for backward compatibility
                            weekNumber: formData.includeWeekInfo
                                ? weekNumber
                                : null,
                            year: formData.includeWeekInfo ? year : null,
                        })
                        .link({
                            owner: user.id,
                            timetable: selectedTimetable.id,
                        })
                );
            }

            // Reset form
            setFormData({
                name: "",
                color: "#000000",
                iconName: "",
                includeWeekInfo: false,
            });
            setErrors({});
            setIsOpen(false);
        } catch (error) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} class:`,
                error
            );
            setErrors({
                name: `Failed to ${
                    isEditMode ? "update" : "create"
                } class. Please try again.`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form when modal closes (only if not in edit mode)
    useEffect(() => {
        if (!isOpen && !isEditMode) {
            setFormData({
                name: "",
                color: "#000000",
                iconName: "",
                includeWeekInfo: false,
            });
            setErrors({});
        }
    }, [isOpen, isEditMode]);

    return (
        <ResponsiveDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={trigger}
            triggerIcon={!trigger && !isControlled ? <Plus size={20} /> : undefined}
            triggerText={!trigger && !isControlled ? "Create Class" : undefined}
            title={isEditMode ? "Edit Class" : "Create New Class"}
            description={
                isEditMode
                    ? "Update the class details."
                    : "Enter the details for your new class."
            }
            contentClassName="sm:max-w-[425px]"
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium leading-none"
                        >
                            Class Name
                        </label>
                        <Input
                            id="name"
                            placeholder="Math 101"
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
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        color: e.target.value,
                                    }));
                                }}
                                className="h-10 w-20"
                            />
                            <Input
                                type="text"
                                value={formData.color}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        color: e.target.value,
                                    }));
                                }}
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
                            onValueChange={(value) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    iconName: value,
                                }));
                            }}
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

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="includeWeekInfo"
                                checked={formData.includeWeekInfo}
                                onCheckedChange={(checked) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        includeWeekInfo: !!checked,
                                    }));
                                }}
                            />
                            <div className="space-y-1 leading-none">
                                <label
                                    htmlFor="includeWeekInfo"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    For this week only
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    This class will only appear in {year} during
                                    week {weekNumber}.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>
                                        {isEditMode
                                            ? "Updating..."
                                            : "Creating..."}
                                    </span>
                                </>
                            ) : isEditMode ? (
                                "Update Class"
                            ) : (
                                "Create Class"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
        </ResponsiveDialog>
    );
}
