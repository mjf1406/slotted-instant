/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { X, Edit } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon, type IconName } from "@/components/ui/icon-picker";
import type { SlotClass } from "@/lib/types";
import { sanitizeHtml } from "@/lib/html-utils";
import parse, { type DOMNode, Text } from "html-react-parser";

interface DisplayClassDetailsProps {
    slotClass: SlotClass | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (updatedSlotClass: SlotClass) => Promise<void>;
    currentDate?: Date;
}

const HashtagBadge: React.FC<{ tag: string }> = ({ tag }) => (
    <Badge
        variant="secondary"
        className="inline-flex items-center bg-blue-100 text-blue-800"
    >
        #{tag}
    </Badge>
);

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

    const sizeClasses = {
        container: "p-1",
        icon: "h-12 w-12 pr-2",
        text: "text-sm",
        button: "p-1",
    };

    const contentStyle = `
        .class-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.75rem;
            margin-bottom: 0.2rem;
        }
        .class-content ol {
            list-style-type: decimal;
            margin-left: 1.5em;
        }
        .class-content ul {
            list-style-type: disc;
            margin-left: 1.5em;
        }
        .class-content li {
            display: list-item;
        }
    `;

    // Get the text to display - prefer slotClass.text, fallback to class.defaultText
    const displayText = slotClass.text || classDetails.defaultText || "";
    const sanitized = sanitizeHtml(displayText);

    const options = {
        replace: (domNode: DOMNode) => {
            if (domNode instanceof Text) {
                const textContent = domNode.data;
                const hashtagRegex = /#[^\s]+/g; // Updated regex to match hashtags until a space
                const parts: React.ReactNode[] = [];
                let lastIndex = 0;
                let match;

                while ((match = hashtagRegex.exec(textContent)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(
                            textContent.substring(lastIndex, match.index)
                        );
                    }
                    parts.push(
                        <HashtagBadge
                            key={match.index}
                            tag={match[0].slice(1)}
                        />
                    );
                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < textContent.length) {
                    parts.push(textContent.substring(lastIndex));
                }

                return <>{parts}</>;
            }
            return undefined;
        },
    };

    const processedText = parse(sanitized, options);

    const handleSave = async () => {
        if (!onSave || !slotClass) return;
        setIsSaving(true);
        try {
            const trimmedText = editText.trim();
            const updatedSlotClass: SlotClass = {
                ...slotClass,
                text: trimmedText || undefined,
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
                <style>{contentStyle}</style>
                <div className="flex h-full flex-col">
                    <div
                        className="flex items-center justify-between p-6"
                        style={{
                            backgroundColor:
                                (classDetails.bgColor as string | undefined) ||
                                "#6b7280",
                            color:
                                (classDetails.textColor as
                                    | string
                                    | undefined) || "#FFFFFF",
                        }}
                    >
                        <h2 className="flex items-center text-4xl font-bold">
                            {classDetails.iconName && (
                                <Icon
                                    name={classDetails.iconName as IconName}
                                    className={`mr-3 text-4xl ${sizeClasses.icon}`}
                                />
                            )}
                            <div className="flex flex-col">
                                <div>{classDetails.name}</div>
                                <div className="text-2xl">{formattedDate}</div>
                            </div>
                        </h2>
                        <div className="flex items-center gap-2">
                            {slotClass.complete && !isEditMode && (
                                <div className="mr-2">✅ All done!</div>
                            )}
                            {!isEditMode && onSave && (
                                <Button
                                    variant="outline"
                                    className="text-foreground"
                                    onClick={() => setIsEditMode(true)}
                                >
                                    <Edit
                                        className="mr-2 text-foreground"
                                        size={20}
                                    />{" "}
                                    Edit
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                            >
                                <X className="h-8 w-8" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="grow">
                        <div className="p-6">
                            {isEditMode ? (
                                <>
                                    <textarea
                                        className="w-full min-h-[400px] rounded-md border border-input bg-background px-4 py-3 text-2xl ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                        placeholder="Enter text for this class..."
                                        value={editText}
                                        onChange={(e) =>
                                            setEditText(e.target.value)
                                        }
                                        autoFocus
                                    />
                                    <div className="mt-16 flex justify-end space-x-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="complete"
                                                checked={isCompleted}
                                                onCheckedChange={(checked) =>
                                                    setIsCompleted(
                                                        checked as boolean
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor="complete"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Complete
                                            </label>
                                        </div>
                                        <Button
                                            onClick={handleCancel}
                                            variant="destructive"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </>
                            ) : displayText ? (
                                <div className="class-content">
                                    {processedText}
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    No content available for this class.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DisplayClassDetails;
