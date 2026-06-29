/** @format */

"use client";

import { useRef, useState } from "react";
import { id } from "@instantdb/react";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DEFAULT_CLOCK_SETTINGS, DEFAULT_QUICK_TEXT_TITLE } from "@/lib/clock-settings";
import { useClockSettings } from "@/hooks/use-clock-queries";
import { QuickTextDialog } from "./QuickTextDialog";

export function QuickTextHeaderButton() {
    const user = db.useUser();
    const { data } = useClockSettings(user?.id);
    const existing = data?.clockSettings?.[0];
    const [isOpen, setIsOpen] = useState(false);
    const pendingSettingsIdRef = useRef<string | null>(null);

    const getSettingsId = () => {
        if (existing?.id) return existing.id;
        if (!pendingSettingsIdRef.current) {
            pendingSettingsIdRef.current = id();
        }
        return pendingSettingsIdRef.current;
    };

    const handleSave = async (text: string, title: string) => {
        if (!user?.id) return;

        const settingsId = getSettingsId();
        const quickTextTitle = title.trim() || DEFAULT_QUICK_TEXT_TITLE;
        if (existing) {
            await db.transact(
                db.tx.clockSettings[settingsId].update({
                    quickText: text || null,
                    quickTextTitle,
                })
            );
            return;
        }

        await db.transact(
            db.tx.clockSettings[settingsId]
                .update({
                    clockSize: DEFAULT_CLOCK_SETTINGS.clockSize,
                    dateSize: DEFAULT_CLOCK_SETTINGS.dateSize,
                    clockBgColor: DEFAULT_CLOCK_SETTINGS.clockBgColor,
                    rotationBgColor: DEFAULT_CLOCK_SETTINGS.rotationBgColor,
                    transitionBgColor:
                        DEFAULT_CLOCK_SETTINGS.transitionBgColor,
                    timerBgColor: DEFAULT_CLOCK_SETTINGS.timerBgColor,
                    dateLocation: DEFAULT_CLOCK_SETTINGS.dateLocation,
                    timeFormat: DEFAULT_CLOCK_SETTINGS.timeFormat,
                    currentTimeSize: DEFAULT_CLOCK_SETTINGS.currentTimeSize,
                    endTimeSize: DEFAULT_CLOCK_SETTINGS.endTimeSize,
                    timerTitleSize: DEFAULT_CLOCK_SETTINGS.timerTitleSize,
                    timerEndBehavior: DEFAULT_CLOCK_SETTINGS.timerEndBehavior,
                    overtimeAutoDismissSeconds:
                        DEFAULT_CLOCK_SETTINGS.overtimeAutoDismissSeconds,
                    bgTransition: DEFAULT_CLOCK_SETTINGS.bgTransition,
                    sidebarDefaultOpen:
                        DEFAULT_CLOCK_SETTINGS.sidebarDefaultOpen,
                    displayContentFontSize:
                        DEFAULT_CLOCK_SETTINGS.displayContentFontSize,
                    displayHeadingFontSize:
                        DEFAULT_CLOCK_SETTINGS.displayHeadingFontSize,
                    quickText: text || null,
                    quickTextTitle,
                })
                .link({ owner: user.id })
        );
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                title="Edit quick text for classroom display"
            >
                <FileText className="size-4" />
                <span className="hidden sm:inline">Quick text</span>
            </Button>
            <QuickTextDialog
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                savedText={existing?.quickText}
                savedTitle={existing?.quickTextTitle}
                onSave={handleSave}
            />
        </>
    );
}
