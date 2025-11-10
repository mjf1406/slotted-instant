/** @format */

"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon-picker";
import type { Class } from "@/lib/types";

interface AddClassDropdownProps {
    availableClasses: Pick<Class, "id" | "name" | "iconName" | "bgColor" | "textColor">[];
    onAddClass: (classId: string) => void;
    showOnHover?: boolean;
}

export function AddClassDropdown({
    availableClasses,
    onAddClass,
    showOnHover = false,
}: AddClassDropdownProps) {
    const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    if (availableClasses.length === 0) {
        return null;
    }

    const buttonClassName = showOnHover
        ? "mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        : "mt-1";

    return (
        <div className={buttonClassName}>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground w-full text-left px-2 py-1 rounded border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
                    >
                        {showOnHover ? "+ Add class" : "Add class"}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {availableClasses.map((classItem) => (
                        <DropdownMenuItem
                            key={classItem.id}
                            onClick={() => onAddClass(classItem.id)}
                            onMouseEnter={() => setHoveredClassId(classItem.id)}
                            onMouseLeave={() => setHoveredClassId(null)}
                            style={{
                                backgroundColor: classItem.bgColor || "#ffffff",
                                color: classItem.textColor || "#000000",
                            }}
                            className={`gap-2 transition-opacity ${
                                hoveredClassId === classItem.id ? "opacity-100" : "opacity-50"
                            }`}
                        >
                            {classItem.iconName ? (
                                <Icon
                                    name={classItem.iconName as IconName}
                                    className="h-4 w-4 shrink-0"
                                    style={{ color: classItem.textColor || "#000000" }}
                                />
                            ) : (
                                <div
                                    className="size-2 rounded-full shrink-0"
                                    style={{ backgroundColor: classItem.bgColor || "#6b7280" }}
                                />
                            )}
                            <span>{classItem.name || "Unnamed"}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

