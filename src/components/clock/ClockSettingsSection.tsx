import { useEffect, useRef, useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { AudioCuesEditor } from "@/components/clock/AudioCuesEditor";
import { BgTransitionSelect } from "@/components/clock/BgTransitionSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ColorInput } from "@/components/ui/color-input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CLOCK_SIZE_OPTIONS,
    DATE_SIZE_OPTIONS,
    DISPLAY_FONT_SIZE_OPTIONS,
    DEFAULT_CLOCK_SETTINGS,
    snapToSizeOption,
} from "@/lib/clock-settings";
import type { AudioCues } from "@/lib/audio-cues";
import { stripUndefinedAudioCues } from "@/lib/audio-cues";
import { createAudioUrlMap, useAudioPlayer } from "@/lib/audio-engine";
import {
    getAllAudioOptions,
    toAudioUrlList,
    useAudioFiles,
    useClockSettings,
} from "@/hooks/use-clock-queries";

export function ClockSettingsSection() {
    const user = db.useUser();
    const { data } = useClockSettings(user?.id);
    const { data: audioData } = useAudioFiles(user?.id);
    const existing = data?.clockSettings?.[0];
    const audioOptions = getAllAudioOptions(audioData?.audioFiles ?? []);
    const urlMap = createAudioUrlMap(
        toAudioUrlList(audioData?.audioFiles ?? [])
    );
    const { preview } = useAudioPlayer(urlMap);

    const [form, setForm] = useState({
        clockSize: String(DEFAULT_CLOCK_SETTINGS.clockSize),
        dateSize: String(DEFAULT_CLOCK_SETTINGS.dateSize),
        currentTimeSize: String(DEFAULT_CLOCK_SETTINGS.currentTimeSize),
        endTimeSize: String(DEFAULT_CLOCK_SETTINGS.endTimeSize),
        timerTitleSize: String(DEFAULT_CLOCK_SETTINGS.timerTitleSize),
        clockBgColor: DEFAULT_CLOCK_SETTINGS.clockBgColor,
        rotationBgColor: DEFAULT_CLOCK_SETTINGS.rotationBgColor,
        transitionBgColor: DEFAULT_CLOCK_SETTINGS.transitionBgColor,
        timerBgColor: DEFAULT_CLOCK_SETTINGS.timerBgColor,
        dateLocation: DEFAULT_CLOCK_SETTINGS.dateLocation,
        timeFormat: DEFAULT_CLOCK_SETTINGS.timeFormat,
        timerEndBehavior: "countUp" as string,
        overtimeAutoDismissSeconds: String(
            DEFAULT_CLOCK_SETTINGS.overtimeAutoDismissSeconds
        ),
        bgTransition: DEFAULT_CLOCK_SETTINGS.bgTransition,
        audioCues: {} as AudioCues,
        sidebarDefaultOpen: DEFAULT_CLOCK_SETTINGS.sidebarDefaultOpen,
        displayContentFontSize: String(
            DEFAULT_CLOCK_SETTINGS.displayContentFontSize
        ),
        displayHeadingFontSize: String(
            DEFAULT_CLOCK_SETTINGS.displayHeadingFontSize
        ),
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const pendingSettingsIdRef = useRef<string | null>(null);

    const getSettingsId = () => {
        if (existing?.id) return existing.id;
        if (!pendingSettingsIdRef.current) {
            pendingSettingsIdRef.current = id();
        }
        return pendingSettingsIdRef.current;
    };

    useEffect(() => {
        if (data === undefined) return;
        if (existing) {
            setForm({
                clockSize: String(
                    snapToSizeOption(
                        existing.clockSize ?? DEFAULT_CLOCK_SETTINGS.clockSize,
                        CLOCK_SIZE_OPTIONS
                    )
                ),
                dateSize: String(
                    snapToSizeOption(
                        existing.dateSize ?? DEFAULT_CLOCK_SETTINGS.dateSize,
                        DATE_SIZE_OPTIONS
                    )
                ),
                currentTimeSize: String(
                    snapToSizeOption(
                        existing.currentTimeSize ?? 24,
                        DATE_SIZE_OPTIONS
                    )
                ),
                endTimeSize: String(
                    snapToSizeOption(existing.endTimeSize ?? 24, DATE_SIZE_OPTIONS)
                ),
                timerTitleSize: String(
                    snapToSizeOption(
                        existing.timerTitleSize ?? 20,
                        DATE_SIZE_OPTIONS
                    )
                ),
                clockBgColor:
                    existing.clockBgColor ?? DEFAULT_CLOCK_SETTINGS.clockBgColor,
                rotationBgColor:
                    existing.rotationBgColor ??
                    DEFAULT_CLOCK_SETTINGS.rotationBgColor,
                transitionBgColor:
                    existing.transitionBgColor ??
                    DEFAULT_CLOCK_SETTINGS.transitionBgColor,
                timerBgColor:
                    existing.timerBgColor ?? DEFAULT_CLOCK_SETTINGS.timerBgColor,
                dateLocation:
                    existing.dateLocation ?? DEFAULT_CLOCK_SETTINGS.dateLocation,
                timeFormat:
                    existing.timeFormat ?? DEFAULT_CLOCK_SETTINGS.timeFormat,
                timerEndBehavior:
                    existing.timerEndBehavior ??
                    DEFAULT_CLOCK_SETTINGS.timerEndBehavior,
                overtimeAutoDismissSeconds: String(
                    existing.overtimeAutoDismissSeconds ?? 0
                ),
                bgTransition:
                    existing.bgTransition ?? DEFAULT_CLOCK_SETTINGS.bgTransition,
                audioCues: (existing.audioCues as AudioCues) ?? {},
                sidebarDefaultOpen:
                    existing.sidebarDefaultOpen ??
                    DEFAULT_CLOCK_SETTINGS.sidebarDefaultOpen,
                displayContentFontSize: String(
                    snapToSizeOption(
                        existing.displayContentFontSize ??
                            DEFAULT_CLOCK_SETTINGS.displayContentFontSize,
                        DISPLAY_FONT_SIZE_OPTIONS
                    )
                ),
                displayHeadingFontSize: String(
                    snapToSizeOption(
                        existing.displayHeadingFontSize ??
                            DEFAULT_CLOCK_SETTINGS.displayHeadingFontSize,
                        DISPLAY_FONT_SIZE_OPTIONS
                    )
                ),
            });
        }
        setHasLoaded(true);
    }, [data, existing]);

    const buildPayload = () => ({
        clockSize: Number(form.clockSize),
        dateSize: Number(form.dateSize),
        currentTimeSize: Number(form.currentTimeSize),
        endTimeSize: Number(form.endTimeSize),
        timerTitleSize: Number(form.timerTitleSize),
        clockBgColor: form.clockBgColor,
        rotationBgColor: form.rotationBgColor,
        transitionBgColor: form.transitionBgColor,
        timerBgColor: form.timerBgColor,
        dateLocation: form.dateLocation,
        timeFormat: form.timeFormat,
        timerEndBehavior: form.timerEndBehavior,
        overtimeAutoDismissSeconds: Number(form.overtimeAutoDismissSeconds),
        bgTransition: form.bgTransition,
        audioCues: stripUndefinedAudioCues(form.audioCues),
        sidebarDefaultOpen: form.sidebarDefaultOpen,
        displayContentFontSize: Number(form.displayContentFontSize),
        displayHeadingFontSize: Number(form.displayHeadingFontSize),
    });

    const persistClockSettings = async (
        payload: ReturnType<typeof buildPayload>
    ) => {
        if (!user?.id) return;
        const settingsId = getSettingsId();
        if (existing) {
            await db.transact(db.tx.clockSettings[settingsId].update(payload));
            return;
        }
        await db.transact(
            db.tx.clockSettings[settingsId]
                .update(payload)
                .link({ owner: user.id })
        );
    };

    const handleHeadingFontSizeChange = (value: string) => {
        const size = Number(value);
        setForm((f) => ({ ...f, displayHeadingFontSize: value }));
        void persistClockSettings({
            ...buildPayload(),
            displayHeadingFontSize: size,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await persistClockSettings(buildPayload());
        } finally {
            setIsSaving(false);
        }
    };

    if (!hasLoaded) return null;

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6">
            <div>
                <h2 className="text-lg font-medium">Clock &amp; display</h2>
                <p className="text-sm text-muted-foreground">
                    Settings for the classroom clock and display page.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Clock size</Label>
                    <Select
                        value={form.clockSize}
                        onValueChange={(v) =>
                            setForm((f) => ({ ...f, clockSize: v }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CLOCK_SIZE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={String(o.value)}>
                                    {o.label} ({o.value}px)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Time format</Label>
                    <Select
                        value={form.timeFormat}
                        onValueChange={(v) =>
                            setForm((f) => ({ ...f, timeFormat: v }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12h">12 hour</SelectItem>
                            <SelectItem value="24h">24 hour</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Clock background</Label>
                    <ColorInput
                        value={form.clockBgColor}
                        onChange={(v) =>
                            setForm((f) => ({ ...f, clockBgColor: v }))
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Timer background</Label>
                    <ColorInput
                        value={form.timerBgColor}
                        onChange={(v) =>
                            setForm((f) => ({ ...f, timerBgColor: v }))
                        }
                    />
                </div>
            </div>

            <BgTransitionSelect
                value={form.bgTransition}
                onValueChange={(v) =>
                    setForm((f) => ({ ...f, bgTransition: v }))
                }
            />

            <div className="grid gap-2">
                <Label>Timer end behavior</Label>
                <Select
                    value={form.timerEndBehavior}
                    onValueChange={(v) =>
                        setForm((f) => ({ ...f, timerEndBehavior: v }))
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="countUp">Count up (overtime)</SelectItem>
                        <SelectItem value="hold">Hold at zero</SelectItem>
                        <SelectItem value="return">Return to clock</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            <div>
                <h3 className="text-base font-medium">Display content</h3>
                <p className="text-sm text-muted-foreground">
                    Font sizes for class content on the classroom display.
                    Heading size updates live on open displays.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Body text size</Label>
                    <Select
                        value={form.displayContentFontSize}
                        onValueChange={(v) =>
                            setForm((f) => ({
                                ...f,
                                displayContentFontSize: v,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DISPLAY_FONT_SIZE_OPTIONS.map((o) => (
                                <SelectItem
                                    key={o.value}
                                    value={String(o.value)}
                                >
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Heading text size</Label>
                    <Select
                        value={form.displayHeadingFontSize}
                        onValueChange={handleHeadingFontSizeChange}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DISPLAY_FONT_SIZE_OPTIONS.map((o) => (
                                <SelectItem
                                    key={o.value}
                                    value={String(o.value)}
                                >
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <AudioCuesEditor
                value={form.audioCues}
                files={audioOptions}
                onChange={(audioCues) =>
                    setForm((f) => ({ ...f, audioCues }))
                }
                onPreview={preview}
            />

            <Button type="submit" disabled={isSaving} className="w-fit">
                {isSaving ? "Saving..." : "Save clock settings"}
            </Button>
        </form>
    );
}
