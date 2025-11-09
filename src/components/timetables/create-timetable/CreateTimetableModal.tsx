/** @format */

"use client";

import React, { useState } from "react";
import { db } from "@/lib/db";
import { CreateTimetableModalContent } from "./CreateTimetableModalContent";
import type { CreateTimetableModalProps } from "./types";

function CreateTimetableModalContentWrapper({
    isOpen,
    setIsOpen,
    trigger,
    isControlled,
    timetable,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trigger?: React.ReactNode;
    isControlled: boolean;
    timetable?: CreateTimetableModalProps["timetable"];
}) {
    return (
        <db.SignedIn>
        <CreateTimetableModalContent
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={trigger}
            isControlled={isControlled}
            timetable={timetable}
        />
    </db.SignedIn>
    );
}

export function CreateTimetableModal({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
    timetable,
}: CreateTimetableModalProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen =
        controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen =
        controlledOnOpenChange !== undefined
            ? controlledOnOpenChange
            : setInternalOpen;
    const isControlled = controlledOpen !== undefined;

    return (
        <CreateTimetableModalContentWrapper
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={trigger}
            isControlled={isControlled}
            timetable={timetable}
        />
    );
}

