/** @format */

"use client";

import React from "react";
import { X, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon-picker";

interface ClassDetailsHeaderProps {
    classDetails: {
        name: string;
        iconName?: string;
        bgColor?: string;
        textColor?: string;
    };
    formattedDate: string;
    isComplete: boolean;
    isEditMode: boolean;
    onEditClick?: () => void;
    onClose: () => void;
    showEditButton: boolean;
    showShortcuts?: boolean;
}

const ClassDetailsHeader: React.FC<ClassDetailsHeaderProps> = ({
    classDetails,
    formattedDate,
    isComplete,
    isEditMode,
    onEditClick,
    onClose,
    showEditButton,
    showShortcuts = false,
}) => {
    const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modKey = isMac ? "⌘" : "Ctrl";
    const sizeClasses = {
        icon: "h-12 w-12 pr-2",
    };

    return (
        <div
            className="flex items-center justify-between p-6"
            style={{
                backgroundColor:
                    (classDetails.bgColor as string | undefined) || "#6b7280",
                color:
                    (classDetails.textColor as string | undefined) ||
                    "#FFFFFF",
            }}
        >
            <h2 className="flex items-center text-4xl font-bold">
                {classDetails.iconName && (
                    <Icon
                        name={classDetails.iconName as IconName}
                        className={`mr-3 text-4xl ${sizeClasses.icon}`}
                    />
                )}
                <div className="flex flex-col">
                    <div>{classDetails.name}</div>
                    <div className="text-2xl">{formattedDate}</div>
                </div>
            </h2>
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                    {isComplete && !isEditMode && (
                        <div className="mr-2 flex items-center gap-1">
                            <Check className="h-6 w-6" />
                            <span>All done!</span>
                        </div>
                    )}
                    {!isEditMode && showEditButton && (
                        <Button
                            variant="outline"
                            className="text-foreground bg-background!"
                            onClick={onEditClick}
                        >
                            <Edit
                                className="mr-2 text-foreground"
                                size={20}
                            />{" "}
                            Edit
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-8 w-8" />
                    </Button>
                </div>
                {showShortcuts && (
                    <div className="flex items-center gap-3 text-sm opacity-80">
                        {!isEditMode && showEditButton && (
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono">
                                    {modKey}+E
                                </kbd>
                                <span>Edit</span>
                            </span>
                        )}
                        {isEditMode && (
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono">
                                    {modKey}+S
                                </kbd>
                                <span>Save</span>
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono">
                                {modKey}+K
                            </kbd>
                            <span>Toggle Complete</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono">
                                Esc
                            </kbd>
                            <span>{isEditMode ? "Cancel" : "Close"}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassDetailsHeader;

