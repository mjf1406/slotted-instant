export const CLOCK_SIZE_OPTIONS = [
    { value: 32, label: "Tiny" },
    { value: 40, label: "Extra small" },
    { value: 48, label: "Small" },
    { value: 56, label: "Compact" },
    { value: 64, label: "Moderate" },
    { value: 72, label: "Medium" },
    { value: 88, label: "Medium large" },
    { value: 96, label: "Large" },
    { value: 112, label: "Extra large" },
    { value: 120, label: "Very large" },
    { value: 144, label: "Huge" },
    { value: 168, label: "Giant" },
    { value: 192, label: "Massive" },
] as const;

export const DATE_SIZE_OPTIONS = [
    { value: 12, label: "Tiny" },
    { value: 16, label: "Extra small" },
    { value: 20, label: "Small" },
    { value: 24, label: "Medium" },
    { value: 28, label: "Moderate" },
    { value: 32, label: "Large" },
    { value: 40, label: "Extra large" },
    { value: 48, label: "Huge" },
    { value: 56, label: "Giant" },
    { value: 64, label: "Massive" },
] as const;

export const DISPLAY_FONT_SIZE_OPTIONS = [
    { value: 12, label: "12px" },
    { value: 14, label: "14px" },
    { value: 16, label: "16px" },
    { value: 18, label: "18px" },
    { value: 20, label: "20px" },
    { value: 24, label: "24px" },
    { value: 28, label: "28px" },
    { value: 32, label: "32px" },
    { value: 36, label: "36px" },
    { value: 40, label: "40px" },
    { value: 48, label: "48px" },
    { value: 56, label: "56px" },
    { value: 64, label: "64px" },
] as const;

export function snapToSizeOption(
    value: number,
    options: readonly { value: number }[]
): number {
    return options.reduce(
        (closest, option) =>
            Math.abs(option.value - value) < Math.abs(closest - value)
                ? option.value
                : closest,
        options[0]!.value
    );
}

export const DEFAULT_CLOCK_SETTINGS = {
    clockSize: 72,
    dateSize: 24,
    clockBgColor: "#ffffff",
    rotationBgColor: "#1e40af",
    transitionBgColor: "#6b7280",
    timerBgColor: "#15803d",
    dateLocation: "above",
    timeFormat: "24h",
    currentTimeSize: 24,
    endTimeSize: 24,
    timerTitleSize: 20,
    timerEndBehavior: "countUp" as const,
    overtimeAutoDismissSeconds: 0,
    bgTransition: "circle",
    sidebarDefaultOpen: true,
    displayContentFontSize: 16,
    displayHeadingFontSize: 32,
};

export const DEFAULT_QUICK_TEXT_TITLE = "Quick text";
