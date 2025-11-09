/** @format */

"use client";

import React from "react";
import { X, Edit } from "lucide-react";
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
}

const ClassDetailsHeader: React.FC<ClassDetailsHeaderProps> = ({
    classDetails,
    formattedDate,
    isComplete,
    isEditMode,
    onEditClick,
    onClose,
    showEditButton,
}) => {
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
            <div className="flex items-center gap-2">
                {isComplete && !isEditMode && (
                    <div className="mr-2">✅ All done!</div>
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
        </div>
    );
};

export default ClassDetailsHeader;

