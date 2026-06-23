import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { OptionalCollapsible } from "@/components/clock/OptionalCollapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberInput } from "@/components/ui/number-input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AudioCueSelect,
  audioIdToSelectValue,
  type AudioFileOption,
  type CueSelectValue,
  selectValueToAudioId,
} from "@/components/clock/AudioCueSelect"
import type { AudioCues, CueRef, VideoCue } from "@/lib/audio-cues"
import {
  buildEmbedUrl,
  parseYouTubeId,
  VIDEO_SIZE_WIDTH,
  type VideoPosition,
  type VideoSize,
} from "@/lib/youtube"

interface AudioCuesEditorProps {
  value: AudioCues
  files: AudioFileOption[]
  allowInherit?: boolean
  onChange: (value: AudioCues) => void
  onPreview?: (audioId: string) => void
}

function updateSlot(
  cues: AudioCues,
  key: keyof Pick<
    AudioCues,
    | "segmentStart"
    | "segmentEnd"
    | "sessionComplete"
    | "overtimeStart"
    | "pause"
    | "resume"
    | "skip"
    | "stop"
  >,
  audioId: CueRef | undefined,
  repeat?: string
): AudioCues {
  const next = { ...cues }
  if (audioId === undefined && repeat === undefined) {
    delete next[key]
    return next
  }
  next[key] = {
    audioId,
    repeat: repeat !== undefined ? Number(repeat) || 1 : cues[key]?.repeat ?? 1,
  }
  return next
}

function SlotRow({
  label,
  slotKey,
  value,
  files,
  allowInherit,
  onChange,
  onPreview,
}: {
  label: string
  slotKey: keyof Pick<
    AudioCues,
    | "segmentStart"
    | "segmentEnd"
    | "sessionComplete"
    | "overtimeStart"
    | "pause"
    | "resume"
    | "skip"
    | "stop"
  >
  value: AudioCues
  files: AudioFileOption[]
  allowInherit: boolean
  onChange: (value: AudioCues) => void
  onPreview?: (audioId: string) => void
}) {
  const slot = value[slotKey]
  const selectValue = audioIdToSelectValue(slot?.audioId, allowInherit)

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <AudioCueSelect
        label={label}
        value={selectValue}
        files={files}
        allowInherit={allowInherit}
        onPreview={onPreview}
        onChange={(next, audioId) => {
          if (next === "inherit") {
            const updated = { ...value }
            delete updated[slotKey]
            onChange(updated)
            return
          }
          onChange(updateSlot(value, slotKey, audioId, String(slot?.repeat ?? 1)))
        }}
      />
      {selectValue !== "inherit" && selectValue !== "none" && (
        <div className="grid gap-2">
          <Label>Repeat count</Label>
          <NumberInput
            value={String(slot?.repeat ?? 1)}
            onChange={(v) =>
              onChange(updateSlot(value, slotKey, slot?.audioId ?? selectValue as CueRef, v))
            }
            min={1}
            step={1}
          />
        </div>
      )}
    </div>
  )
}

type VideoMode = "inherit" | "none" | "set"

function videoModeFromCue(
  video: VideoCue | undefined,
  allowInherit: boolean
): VideoMode {
  if (!video) return allowInherit ? "inherit" : "none"
  if (video.youtubeId === "none") return "none"
  // Any other video entry means "set" — including empty URL while editing
  return "set"
}

function VideoCueRow({
  value,
  allowInherit,
  onChange,
}: {
  value: AudioCues
  allowInherit: boolean
  onChange: (value: AudioCues) => void
}) {
  const video = value.video
  const mode = videoModeFromCue(video, allowInherit)
  const urlInput =
    video?.youtubeId && video.youtubeId !== "none" ? video.youtubeId : ""

  const parsedId = useMemo(() => {
    if (mode !== "set" || !urlInput.trim()) return null
    return parseYouTubeId(urlInput)
  }, [mode, urlInput])

  const updateVideo = (patch: Partial<VideoCue>) => {
    onChange({
      ...value,
      video: { ...video, ...patch },
    })
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="grid gap-2">
        <Label>Video (play during segment)</Label>
        <Select
          value={mode}
          onValueChange={(next) => {
            if (next === "inherit") {
              const updated = { ...value }
              delete updated.video
              onChange(updated)
              return
            }
            if (next === "none") {
              onChange({
                ...value,
                video: { youtubeId: "none" },
              })
              return
            }
            onChange({
              ...value,
              video: {
                youtubeId: parsedId ?? video?.youtubeId,
                position: video?.position ?? "top",
                size: video?.size ?? "small",
                muted: video?.muted ?? false,
              },
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowInherit && <SelectItem value="inherit">Use default</SelectItem>}
            <SelectItem value="none">No video</SelectItem>
            <SelectItem value="set">Set video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "set" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="video-url">YouTube URL or video ID</Label>
            <Input
              id="video-url"
              value={urlInput}
              onChange={(e) =>
                updateVideo({ youtubeId: e.target.value.trim() })
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {urlInput.trim() && !parsedId && (
              <p className="text-xs text-destructive">
                Enter a valid YouTube link or 11-character video ID.
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Position</Label>
              <Select
                value={(video?.position as VideoPosition) ?? "top"}
                onValueChange={(v) =>
                  updateVideo({ position: v as VideoPosition })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Size</Label>
              <Select
                value={(video?.size as VideoSize) ?? "small"}
                onValueChange={(v) => updateVideo({ size: v as VideoSize })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <Label htmlFor="video-muted">Muted</Label>
              <p className="text-xs text-muted-foreground">
                Off plays with sound. Browsers may block unmuted autoplay until
                you interact with the page.
              </p>
            </div>
            <Switch
              id="video-muted"
              checked={video?.muted ?? false}
              onCheckedChange={(checked) => updateVideo({ muted: checked })}
            />
          </div>

          {parsedId && (
            <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
              <iframe
                src={buildEmbedUrl({
                  id: parsedId,
                  muted: video?.muted ?? false,
                  loop: true,
                })}
                title="Video preview"
                className="aspect-video w-full border-0"
                style={{ maxWidth: VIDEO_SIZE_WIDTH.small }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Shows a small YouTube player while this segment runs. Great for
        transition countdowns or visual cues.
      </p>
    </div>
  )
}

export function AudioCuesEditor({
  value,
  files,
  allowInherit = false,
  onChange,
  onPreview,
}: AudioCuesEditorProps) {
  const countdown = value.countdownTick
  const interval = value.intervalChime
  const timeRemaining = value.timeRemaining ?? []

  const playDuring = value.playDuring
  const playDuringSelect = audioIdToSelectValue(
    playDuring?.audioId,
    allowInherit
  )
  const countdownSelect = audioIdToSelectValue(
    countdown?.audioId,
    allowInherit
  )
  const intervalSelect = audioIdToSelectValue(interval?.audioId, allowInherit)

  const updateTimeRemaining = (
    index: number,
    patch: Partial<(typeof timeRemaining)[number]>
  ) => {
    const next = [...timeRemaining]
    next[index] = { ...next[index]!, ...patch }
    onChange({ ...value, timeRemaining: next })
  }

  return (
    <div className="grid gap-4">
      <OptionalCollapsible title="Timer events">
        <SlotRow
          label="Segment / timer start"
          slotKey="segmentStart"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
        <div className="grid gap-3 rounded-lg border p-3">
          <AudioCueSelect
            label="Play during segment"
            value={playDuringSelect}
            files={files}
            allowInherit={allowInherit}
            onPreview={onPreview}
            onChange={(next, audioId) => {
              if (next === "inherit") {
                const updated = { ...value }
                delete updated.playDuring
                onChange(updated)
                return
              }
              onChange({
                ...value,
                playDuring: { audioId },
              })
            }}
          />
          <p className="text-xs text-muted-foreground">
            Loops for the entire segment. Useful for transition music or
            background ambience.
          </p>
        </div>
        <VideoCueRow
          value={value}
          allowInherit={allowInherit}
          onChange={onChange}
        />
        <SlotRow
          label="Segment end"
          slotKey="segmentEnd"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
        <SlotRow
          label="Session complete"
          slotKey="sessionComplete"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
        <SlotRow
          label="Overtime start"
          slotKey="overtimeStart"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
      </OptionalCollapsible>

      <OptionalCollapsible title="Warnings & ticks">
        <div className="grid gap-3 rounded-lg border p-3">
          <Label>Time remaining warnings</Label>
          <p className="text-xs text-muted-foreground">
            Play a sound when the countdown reaches each threshold.
          </p>
          {timeRemaining.map((rule, index) => (
            <div key={index} className="grid gap-2 rounded-md border p-3">
              <AudioCueSelect
                label={`Warning ${index + 1} sound`}
                value={audioIdToSelectValue(rule.audioId, false) as CueSelectValue}
                files={files}
                onPreview={onPreview}
                onChange={(_, audioId) =>
                  updateTimeRemaining(index, { audioId })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Seconds remaining</Label>
                  <NumberInput
                    value={String(rule.secondsRemaining)}
                    onChange={(v) =>
                      updateTimeRemaining(index, {
                        secondsRemaining: Number(v) || 0,
                      })
                    }
                    min={1}
                    step={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Repeat</Label>
                  <NumberInput
                    value={String(rule.repeat ?? 1)}
                    onChange={(v) =>
                      updateTimeRemaining(index, { repeat: Number(v) || 1 })
                    }
                    min={1}
                    step={1}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = timeRemaining.filter((_, i) => i !== index)
                  onChange({
                    ...value,
                    timeRemaining: next.length > 0 ? next : undefined,
                  })
                }}
              >
                <Trash2 />
                Remove warning
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                timeRemaining: [
                  ...timeRemaining,
                  { secondsRemaining: 60, repeat: 1 },
                ],
              })
            }
          >
            <Plus />
            Add warning
          </Button>
        </div>

        <div className="grid gap-3 rounded-lg border p-3">
          <AudioCueSelect
            label="Countdown tick (last N seconds)"
            value={countdownSelect}
            files={files}
            allowInherit={allowInherit}
            onPreview={onPreview}
            onChange={(next, audioId) => {
              if (next === "inherit") {
                const updated = { ...value }
                delete updated.countdownTick
                onChange(updated)
                return
              }
              onChange({
                ...value,
                countdownTick: {
                  audioId,
                  lastSeconds: countdown?.lastSeconds ?? 10,
                },
              })
            }}
          />
          {countdownSelect !== "inherit" && countdownSelect !== "none" && (
            <div className="grid gap-2">
              <Label>Last seconds</Label>
              <NumberInput
                value={String(countdown?.lastSeconds ?? 10)}
                onChange={(v) =>
                  onChange({
                    ...value,
                    countdownTick: {
                      audioId: countdown?.audioId ?? selectValueToAudioId(countdownSelect),
                      lastSeconds: Number(v) || 10,
                    },
                  })
                }
                min={1}
                step={1}
              />
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-lg border p-3">
          <AudioCueSelect
            label="Interval chime"
            value={intervalSelect}
            files={files}
            allowInherit={allowInherit}
            onPreview={onPreview}
            onChange={(next, audioId) => {
              if (next === "inherit") {
                const updated = { ...value }
                delete updated.intervalChime
                onChange(updated)
                return
              }
              onChange({
                ...value,
                intervalChime: {
                  audioId,
                  everyMinutes: interval?.everyMinutes ?? 5,
                },
              })
            }}
          />
          {intervalSelect !== "inherit" && intervalSelect !== "none" && (
            <div className="grid gap-2">
              <Label>Every (minutes)</Label>
              <NumberInput
                value={String(interval?.everyMinutes ?? 5)}
                onChange={(v) =>
                  onChange({
                    ...value,
                    intervalChime: {
                      audioId: interval?.audioId ?? selectValueToAudioId(intervalSelect),
                      everyMinutes: Number(v) || 5,
                    },
                  })
                }
                min={1}
                step={1}
              />
            </div>
          )}
        </div>
      </OptionalCollapsible>

      <OptionalCollapsible title="Transport controls">
        <SlotRow
          label="Pause"
          slotKey="pause"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
        <SlotRow
          label="Resume"
          slotKey="resume"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
        <SlotRow
          label="Skip segment"
          slotKey="skip"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
        <SlotRow
          label="Stop"
          slotKey="stop"
          value={value}
          files={files}
          allowInherit={allowInherit}
          onChange={onChange}
          onPreview={onPreview}
        />
      </OptionalCollapsible>
    </div>
  )
}
