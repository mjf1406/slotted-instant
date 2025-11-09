/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ClassDetailsEditModeProps {
    editText: string;
    isCompleted: boolean;
    isSaving: boolean;
    onTextChange: (text: string) => void;
    onCompletedChange: (completed: boolean) => void;
    onSave: () => void;
    onCancel: () => void;
}

const ClassDetailsEditMode: React.FC<ClassDetailsEditModeProps> = ({
    editText,
    isCompleted,
    isSaving,
    onTextChange,
    onCompletedChange,
    onSave,
    onCancel,
}) => {
    return (
        <>
            <RichTextEditor
                value={editText}
                onChange={onTextChange}
                placeholder="Enter text for this class..."
                className="min-h-[400px] px-4 py-3"
                autoFocus
            />
            <div className="mt-16 flex justify-end space-x-2">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="complete"
                        checked={isCompleted}
                        onCheckedChange={(checked) =>
                            onCompletedChange(checked as boolean)
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
                    onClick={onCancel}
                    variant="destructive"
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button onClick={onSave} disabled={isSaving}>
                    Save
                </Button>
            </div>
        </>
    );
};

export default ClassDetailsEditMode;

