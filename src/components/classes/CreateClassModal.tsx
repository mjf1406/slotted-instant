/** @format */

"use client";

import React, { useState } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateClassModalContent } from "./CreateClassModalContent";
import type { CreateClassModalProps } from "./types";

function CreateClassModalContentWrapper({
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
    classItem?: CreateClassModalProps["classItem"];
}) {
    return (
        <db.SignedIn>
            <CreateClassModalContent
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
    const isOpen =
        controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen =
        controlledOnOpenChange !== undefined
            ? controlledOnOpenChange
            : setInternalOpen;
    const isControlled = controlledOpen !== undefined;

    const defaultTrigger = (
        <Button variant="outline">
            <Plus className="h-4 w-4" />
            Create Class
        </Button>
    );

    // Only use default trigger if not controlled and no trigger provided
    const finalTrigger = trigger || (!isControlled ? defaultTrigger : undefined);

    return (
        <CreateClassModalContentWrapper
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={finalTrigger}
            isControlled={isControlled}
            classItem={classItem}
        />
    );
}

