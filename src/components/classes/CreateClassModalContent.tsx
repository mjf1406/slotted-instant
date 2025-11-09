/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { Loader2, Plus } from "lucide-react";
import { IconPicker, Icon } from "@/components/ui/icon-picker";
import { useCreateClass } from "./useCreateClass";
import type { Class } from "@/lib/types";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface CreateClassModalContentProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    isControlled: boolean;
    classItem?: Class | null;
}

export function CreateClassModalContent({
    isOpen,
    setIsOpen,
    trigger,
    isControlled,
    classItem,
}: CreateClassModalContentProps) {
    const {
        formData,
        errors,
        isLoading,
        isEditMode,
        year,
        weekNumber,
        handleFieldChange,
        handleSubmit,
    } = useCreateClass(isOpen, classItem);

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
                !trigger && !isControlled ? "Create Class" : undefined
            }
            title={isEditMode ? "Edit Class" : "Create New Class"}
            description={
                isEditMode
                    ? "Update the class details."
                    : "Enter the details for your new class."
            }
            contentClassName="sm:max-w-[600px]"
        >
            <form onSubmit={onSubmit} className="space-y-6">
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
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="bgColor"
                                className="text-sm font-medium leading-none"
                            >
                                Background Color
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="bgColor"
                                    type="color"
                                    value={formData.bgColor}
                                    onChange={(e) =>
                                        handleFieldChange("bgColor", e.target.value)
                                    }
                                    className="h-10 w-20"
                                />
                                <Input
                                    type="text"
                                    value={formData.bgColor}
                                    onChange={(e) =>
                                        handleFieldChange("bgColor", e.target.value)
                                    }
                                    placeholder="#000000"
                                />
                            </div>
                            {errors.bgColor && (
                                <p className="text-sm text-destructive">
                                    {errors.bgColor}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="textColor"
                                className="text-sm font-medium leading-none"
                            >
                                Text Color
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="textColor"
                                    type="color"
                                    value={formData.textColor}
                                    onChange={(e) =>
                                        handleFieldChange("textColor", e.target.value)
                                    }
                                    className="h-10 w-20"
                                />
                                <Input
                                    type="text"
                                    value={formData.textColor}
                                    onChange={(e) =>
                                        handleFieldChange("textColor", e.target.value)
                                    }
                                    placeholder="#FFFFFF"
                                />
                            </div>
                            {errors.textColor && (
                                <p className="text-sm text-destructive">
                                    {errors.textColor}
                                </p>
                            )}
                        </div>
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

                <div className="space-y-2">
                    <label
                        htmlFor="defaultText"
                        className="text-sm font-medium leading-none"
                    >
                        Default Text
                    </label>
                    <RichTextEditor
                        id="defaultText"
                        value={formData.defaultText}
                        onChange={(nextValue) =>
                            handleFieldChange("defaultText", nextValue)
                        }
                        placeholder="Enter default text for this class..."
                        ariaInvalid={!!errors.defaultText}
                        className="min-h-[200px]"
                    />
                    {errors.defaultText && (
                        <p className="text-sm text-destructive">
                            {errors.defaultText}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeWeekInfo"
                            checked={formData.includeWeekInfo}
                            onCheckedChange={(checked) =>
                                handleFieldChange("includeWeekInfo", !!checked)
                            }
                        />
                        <div className="space-y-1 leading-none">
                            <label
                                htmlFor="includeWeekInfo"
                                className="text-sm font-medium cursor-pointer"
                            >
                                For this week only
                            </label>
                            <p className="text-xs text-muted-foreground">
                                This class will only appear in {year} during week{" "}
                                {weekNumber}.
                            </p>
                        </div>
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

