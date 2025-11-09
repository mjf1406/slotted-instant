/** @format */

"use client";

import React, { useState } from "react";
import { db } from "@/lib/db";
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

    return (
        <CreateClassModalContentWrapper
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={trigger}
            isControlled={isControlled}
            classItem={classItem}
        />
    );
}

