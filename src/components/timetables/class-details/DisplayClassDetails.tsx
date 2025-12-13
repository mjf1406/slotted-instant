/** @format */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SlotClass } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
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
    const { settings } = useSettings();
    const displayZoomLevel = settings.displayZoomLevel ?? 1.0;
    const [isEditMode, setIsEditMode] = useState(false);
    const [editText, setEditText] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Track the last slotClass ID to prevent unnecessary updates
    const lastSlotClassIdRef = useRef<string | null>(null);

    // Sync local state when slotClass changes (for real-time updates)
    // Only update when not in edit mode to avoid overwriting user input
    useEffect(() => {
        if (!slotClass) {
            lastSlotClassIdRef.current = null;
            return;
        }

        // Only update if the slotClass ID actually changed (not just object reference)
        const currentId = slotClass.id;
        if (currentId === lastSlotClassIdRef.current && !isEditMode) {
            return;
        }

        lastSlotClassIdRef.current = currentId;

        if (isEditMode) {
            // When entering edit mode, initialize with current slotClass values
            setEditText(slotClass.text || slotClass.class?.defaultText || "");
            setIsCompleted(slotClass.complete || false);
        } else {
            // When not in edit mode, sync with real-time updates from database
            setEditText(slotClass.text || slotClass.class?.defaultText || "");
            setIsCompleted(slotClass.complete || false);
        }
    }, [slotClass?.id, slotClass?.text, slotClass?.complete, isEditMode]); // Depend on values, not object reference

    // Reset edit mode when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
            setEditText("");
        }
    }, [isOpen]);

    const handleSave = useCallback(async () => {
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
    }, [onSave, slotClass, editText, isCompleted]);

    const handleCancel = useCallback(() => {
        if (!slotClass) return;
        setIsEditMode(false);
        setEditText(slotClass.text || slotClass.class?.defaultText || "");
        setIsCompleted(slotClass.complete || false);
    }, [slotClass]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                // Allow Ctrl/Cmd+S for save even in text inputs
                const isMac =
                    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
                const modKey = isMac ? event.metaKey : event.ctrlKey;
                if (modKey && event.key === "s" && isEditMode) {
                    event.preventDefault();
                    if (!isSaving && onSave) {
                        handleSave();
                    }
                }
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modKey = isMac ? event.metaKey : event.ctrlKey;

            // Save: Ctrl/Cmd + S (only in edit mode)
            if (modKey && event.key === "s" && isEditMode) {
                event.preventDefault();
                if (!isSaving && onSave) {
                    handleSave();
                }
            }

            // Edit: Ctrl/Cmd + E (only when not in edit mode)
            if (modKey && event.key === "e" && !isEditMode && onSave) {
                event.preventDefault();
                setIsEditMode(true);
            }

            // Toggle complete: Ctrl/Cmd + K
            if (modKey && event.key === "k") {
                event.preventDefault();
                if (isEditMode) {
                    setIsCompleted(!isCompleted);
                } else if (onSave && slotClass) {
                    // Toggle complete even when not in edit mode
                    const updatedSlotClass: SlotClass = {
                        ...slotClass,
                        complete: !slotClass.complete,
                    };
                    onSave(updatedSlotClass);
                }
            }

            // Escape: Cancel edit mode or close dialog
            if (event.key === "Escape") {
                if (isEditMode) {
                    handleCancel();
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        isOpen,
        isEditMode,
        isSaving,
        onSave,
        slotClass,
        isCompleted,
        handleSave,
        handleCancel,
        onClose,
    ]);

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

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
        >
            <DialogContent
                className="fixed! inset-0! w-screen! h-screen! max-w-none! translate-x-0! translate-y-0! top-0! left-0! right-0! bottom-0! rounded-none! p-0 text-2xl [&>button]:hidden"
                showCloseButton={false}
                style={{
                    zoom: displayZoomLevel,
                    transformOrigin: "center center",
                }}
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
                        showShortcuts={true}
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
