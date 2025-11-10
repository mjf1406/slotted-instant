/** @format */

"use client";

import { formatTimeString, timeToMinutes } from "../utils";
import { useSettings } from "@/lib/settings-context";
import type { SlotEntity, SlotClass, Class } from "@/lib/types";
import { SlotClassCard } from "./SlotClassCard";
import { AddClassDropdown } from "../AddClassDropdown";
import { SlotActionMenu } from "./SlotActionMenu";

interface TimeSlotProps {
    slot: SlotEntity;
    classesInSlot: SlotClass[];
    availableClasses: Pick<
        Class,
        "id" | "name" | "iconName" | "bgColor" | "textColor"
    >[];
    isDisabled: boolean;
    onEditSlot: (slot: SlotEntity) => void;
    onDeleteSlotClass: (slotClassId: string) => void;
    onAddClassToSlot: (classId: string) => void;
    onSlotClassClick?: (slotClass: SlotClass) => void;
    style: React.CSSProperties;
}

export function TimeSlot({
    slot,
    classesInSlot,
    availableClasses,
    isDisabled,
    onEditSlot,
    onDeleteSlotClass,
    onAddClassToSlot,
    onSlotClassClick,
    style,
}: TimeSlotProps) {
    const { settings } = useSettings();
    const hasClass = classesInSlot.length > 0;
    const hasAvailableClasses = availableClasses.length > 0;
    
    // Calculate duration in minutes
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = Math.floor(durationMinutes / 60);
    const durationMins = durationMinutes % 60;
    const durationText = durationHours > 0 
        ? `${durationHours}h${durationMins > 0 ? ` ${durationMins}m` : ''}`
        : `${durationMins}m`;

    return (
        <div
            className="absolute left-1 right-1 group"
            style={style}
        >
            <div
                className={`border rounded py-1.5 px-0 shadow-sm transition-colors h-full flex flex-col relative ${
                    isDisabled
                        ? "border-destructive/50 bg-destructive/10 opacity-40 dark:opacity-60"
                        : "border-primary/30 bg-primary/10 hover:bg-primary/20"
                }`}
            >
                <div className="flex flex-col flex-1 min-w-0 w-full">
                    <div className="text-xs font-medium mb-1 text-foreground px-1.5">
                        {formatTimeString(
                            slot.startTime,
                            settings.timeFormat as "12" | "24"
                        )}{" "}
                        -{" "}
                        {formatTimeString(
                            slot.endTime,
                            settings.timeFormat as "12" | "24"
                        )}
                        {settings.showSlotDuration && ` (${durationText})`}
                    </div>
                    {hasClass ? (
                        <div className="space-y-1.5">
                            {classesInSlot.map((slotClass) => (
                                <SlotClassCard
                                    key={slotClass.id}
                                    slotClass={slotClass}
                                    onDelete={onDeleteSlotClass}
                                    onClick={onSlotClassClick}
                                />
                            ))}
                            {hasAvailableClasses && !isDisabled && (
                                <AddClassDropdown
                                    availableClasses={availableClasses}
                                    onAddClass={onAddClassToSlot}
                                    showOnHover={true}
                                />
                            )}
                        </div>
                    ) : (
                        hasAvailableClasses &&
                        !isDisabled && (
                            <AddClassDropdown
                                availableClasses={availableClasses}
                                onAddClass={onAddClassToSlot}
                                showOnHover={false}
                            />
                        )
                    )}
                </div>
                {hasClass && (
                    <SlotActionMenu
                        slot={slot}
                        onEdit={onEditSlot}
                    />
                )}
            </div>
        </div>
    );
}
