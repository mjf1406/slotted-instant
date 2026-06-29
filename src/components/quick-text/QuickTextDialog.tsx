/** @format */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_QUICK_TEXT_TITLE } from "@/lib/clock-settings";

interface QuickTextDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    savedText?: string | null;
    savedTitle?: string | null;
    onSave: (text: string, title: string) => Promise<void>;
}

export function QuickTextDialog({
    isOpen,
    onOpenChange,
    savedText,
    savedTitle,
    onSave,
}: QuickTextDialogProps) {
    const [text, setText] = useState("");
    const [title, setTitle] = useState(DEFAULT_QUICK_TEXT_TITLE);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setText(savedText || "");
            setTitle(savedTitle?.trim() || DEFAULT_QUICK_TEXT_TITLE);
        }
    }, [isOpen, savedText, savedTitle]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const trimmedTitle = title.trim() || DEFAULT_QUICK_TEXT_TITLE;
            await onSave(text, trimmedTitle);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save quick text:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ResponsiveDialog
            open={isOpen}
            onOpenChange={onOpenChange}
            title="Quick text"
            description="Add text to show on the classroom display when no class is scheduled."
            contentClassName="sm:max-w-[600px]"
        >
            <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="quick-text-title"
                            className="text-sm font-medium leading-none"
                        >
                            Display title
                        </label>
                        <Input
                            id="quick-text-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={DEFAULT_QUICK_TEXT_TITLE}
                        />
                    </div>
                    <RichTextEditor
                        value={text}
                        onChange={setText}
                        placeholder="Enter text to display..."
                        className="min-h-[300px] px-4 py-3"
                        autoFocus
                    />
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
                <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </DialogFooter>
        </ResponsiveDialog>
    );
}
