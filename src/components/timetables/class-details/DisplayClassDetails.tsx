/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SlotClass } from "@/lib/types";
import ClassDetailsHeader from "./ClassDetailsHeader";
import ClassDetailsDisplayMode from "./ClassDetailsDisplayMode";
import ClassDetailsEditMode from "./ClassDetailsEditMode";

interface DisplayClassDetailsProps {
    slotClass: SlotClass | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (updatedSlotClass: SlotClass) => Promise<void>;
    currentDate?: Date;
}

const DisplayClassDetails: React.FC<DisplayClassDetailsProps> = ({
    slotClass,
    isOpen,
    onClose,
    onSave,
    currentDate = new Date(),
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editText, setEditText] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isEditMode && slotClass) {
            setEditText(slotClass.text || slotClass.class?.defaultText || "");
            setIsCompleted(slotClass.complete || false);
        }
    }, [isEditMode, slotClass]);

    // Sync local state when slotClass changes (for real-time updates)
    useEffect(() => {
        if (!isEditMode && slotClass) {
            // Update local state to reflect the latest slotClass data
            // This ensures the component reflects real-time changes from the database
            setEditText(slotClass.text || slotClass.class?.defaultText || "");
            setIsCompleted(slotClass.complete || false);
        }
    }, [slotClass, isEditMode]);

    // Reset edit mode when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
            setEditText("");
        }
    }, [isOpen]);

    if (!slotClass || !slotClass.class) return null;

    const classDetails = slotClass.class;

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formattedDate = formatDate(currentDate);

    // Get the text to display - prefer slotClass.text, fallback to class.defaultText
    const displayText = slotClass.text || classDetails.defaultText || "";

    const handleSave = async () => {
        if (!onSave || !slotClass) return;
        setIsSaving(true);
        try {
            const updatedSlotClass: SlotClass = {
                ...slotClass,
                text: editText || undefined,
                complete: isCompleted,
            };
            await onSave(updatedSlotClass);
            setIsEditMode(false);
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setEditText(slotClass.text || slotClass.class?.defaultText || "");
        setIsCompleted(slotClass.complete || false);
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
        >
            <DialogContent
                className="fixed! inset-0! w-screen! h-screen! max-w-none! translate-x-0! translate-y-0! top-0! left-0! right-0! bottom-0! rounded-none! p-0 text-2xl [&>button]:hidden"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">
                    {classDetails.name} - {formattedDate}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Class details for {classDetails.name} on {formattedDate}
                </DialogDescription>
                <div className="flex h-full flex-col">
                    <ClassDetailsHeader
                        classDetails={classDetails}
                        formattedDate={formattedDate}
                        isComplete={slotClass.complete || false}
                        isEditMode={isEditMode}
                        onEditClick={() => setIsEditMode(true)}
                        onClose={onClose}
                        showEditButton={!!onSave}
                    />
                    <ScrollArea className="grow">
                        <div className="p-6">
                            {isEditMode ? (
                                <ClassDetailsEditMode
                                    editText={editText}
                                    isCompleted={isCompleted}
                                    isSaving={isSaving}
                                    onTextChange={setEditText}
                                    onCompletedChange={setIsCompleted}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                />
                            ) : (
                                <ClassDetailsDisplayMode
                                    displayText={displayText}
                                />
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DisplayClassDetails;

