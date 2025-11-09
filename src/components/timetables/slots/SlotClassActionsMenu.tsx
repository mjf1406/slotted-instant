/** @format */

"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import type { SlotClass } from "@/lib/types";

interface SlotClassActionsMenuProps {
    slotClass: SlotClass;
    onDelete: (slotClassId: string) => void;
}

export function SlotClassActionsMenu({
    slotClass,
    onDelete,
}: SlotClassActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="h-3 w-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(slotClass.id);
                    }}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

