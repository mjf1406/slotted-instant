/** @format */

"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { SlotEntity } from "@/lib/types";

interface SlotActionMenuProps {
    slot: SlotEntity;
    onEdit: (slot: SlotEntity) => void;
    onDelete?: (slot: SlotEntity) => void;
}

export function SlotActionMenu({ slot, onEdit, onDelete }: SlotActionMenuProps) {
    return (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="p-1 hover:bg-background/20 rounded"
                    >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(slot)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    {onDelete && (
                        <DropdownMenuItem
                            onClick={() => onDelete(slot)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
