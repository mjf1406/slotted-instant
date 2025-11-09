/** @format */

"use client";

import { Check } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon-picker";
import { SlotClassActionsMenu } from "./SlotClassActionsMenu";
import type { SlotClass } from "@/lib/types";

interface SlotClassCardProps {
    slotClass: SlotClass;
    onDelete: (slotClassId: string) => void;
    onClick?: (slotClass: SlotClass) => void;
}

export function SlotClassCard({
    slotClass,
    onDelete,
    onClick,
}: SlotClassCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on the actions menu
        if (
            (e.target as HTMLElement).closest('[role="menu"]') ||
            (e.target as HTMLElement).closest('button')
        ) {
            return;
        }
        onClick?.(slotClass);
    };

    const bgColor = slotClass.class?.bgColor || "#6b7280";
    const textColor = slotClass.class?.textColor || "#FFFFFF";

    return (
        <div
            className="text-xs p-2 rounded-md flex items-center gap-2 shadow-sm border border-white/20 group/card w-full cursor-pointer hover:opacity-90 transition-opacity"
            style={{
                backgroundColor: bgColor,
                color: textColor,
            }}
            onClick={handleClick}
        >
            {slotClass.class?.iconName && (
                <Icon
                    name={slotClass.class.iconName as IconName}
                    className="h-4 w-4 shrink-0"
                />
            )}
            <span className="font-medium truncate flex-1">
                {slotClass.class?.name || "Unnamed"}
            </span>
            {slotClass.complete && (
                <Check className="h-4 w-4 shrink-0" />
            )}
            <SlotClassActionsMenu
                slotClass={slotClass}
                onDelete={onDelete}
            />
        </div>
    );
}

