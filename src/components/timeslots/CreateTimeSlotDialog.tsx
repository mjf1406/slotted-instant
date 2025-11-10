/** @format */

"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTimeSlotDialogContent } from "./CreateTimeSlotDialogContent";
import type { CreateTimeSlotDialogProps } from "./types";

export function CreateTimeSlotDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
}: CreateTimeSlotDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen =
        controlledOnOpenChange !== undefined
            ? controlledOnOpenChange
            : setInternalOpen;

    const defaultTrigger = (
        <Button variant="default">
            <Plus className="h-4 w-4" />
            Time Slot
        </Button>
    );

    return (
        <db.SignedIn>
            <CreateTimeSlotDialogContent
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                trigger={trigger || defaultTrigger}
            />
        </db.SignedIn>
    );
}
