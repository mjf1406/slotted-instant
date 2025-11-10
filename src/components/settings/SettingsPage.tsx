/** @format */

"use client";

import { useState } from "react";
import { useSettings } from "@/lib/settings-context";
import type { WeekStartDay, TimeFormat } from "@/lib/settings-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

export function SettingsPage() {
    const { settings, isLoading, updateSettings } = useSettings();
    const [weekStartDay, setWeekStartDay] = useState<WeekStartDay>(
        settings.weekStartDay
    );
    const [timeFormat, setTimeFormat] = useState<TimeFormat>(
        settings.timeFormat
    );
    const [showSlotDuration, setShowSlotDuration] = useState<boolean>(
        settings.showSlotDuration ?? true
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Sync local state when settings change
    useEffect(() => {
        setWeekStartDay(settings.weekStartDay);
        setTimeFormat(settings.timeFormat);
        setShowSlotDuration(settings.showSlotDuration ?? true);
    }, [settings]);

    const hasChanges =
        weekStartDay !== settings.weekStartDay ||
        timeFormat !== settings.timeFormat ||
        showSlotDuration !== (settings.showSlotDuration ?? true);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        try {
            await updateSettings({
                weekStartDay,
                timeFormat,
                showSlotDuration,
            });
            setSaveMessage("Settings saved successfully!");
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            setSaveMessage("Failed to save settings. Please try again.");
            console.error("Error saving settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setWeekStartDay(settings.weekStartDay);
        setTimeFormat(settings.timeFormat);
        setShowSlotDuration(settings.showSlotDuration ?? true);
        setSaveMessage(null);
    };

    const handleBack = useCallback(() => {
        const params = new URLSearchParams(window.location.search);
        params.delete("page");
        const newUrl = `${window.location.pathname}${
            params.toString() ? `?${params.toString()}` : ""
        }`;
        window.history.pushState({}, "", newUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="flex items-center gap-4 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Back to timetable"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold">Settings</h1>
            </div>
            <p className="text-muted-foreground mb-6">
                Customize your timetable preferences
            </p>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Week Start Day
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Choose which day your week begins on
                        </p>
                    </div>
                    <Select
                        value={weekStartDay}
                        onValueChange={(value) =>
                            setWeekStartDay(value as WeekStartDay)
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div>
                        <h3 className="text-lg font-semibold">Time Format</h3>
                        <p className="text-sm text-muted-foreground">
                            Choose between 12-hour (AM/PM) or 24-hour format
                        </p>
                    </div>
                    <Select
                        value={timeFormat}
                        onValueChange={(value) =>
                            setTimeFormat(value as TimeFormat)
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24">24-hour (14:30)</SelectItem>
                            <SelectItem value="12">
                                12-hour (2:30 PM)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Display Options
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Customize what information is shown in the timetable
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showSlotDuration"
                            checked={showSlotDuration}
                            onCheckedChange={(checked) =>
                                setShowSlotDuration(!!checked)
                            }
                        />
                        <div className="space-y-1 leading-none">
                            <label
                                htmlFor="showSlotDuration"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Show time slot duration
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Display the duration (e.g., "1h 30m") next to
                                the time in each slot header
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                    {hasChanges && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={isSaving}
                        >
                            Reset
                        </Button>
                    )}
                    {saveMessage && (
                        <span
                            className={`text-sm ${
                                saveMessage.includes("success")
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-destructive"
                            }`}
                        >
                            {saveMessage}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
