/** @format */

/**
 * Calculates the relative luminance of a color
 * Based on WCAG 2.0 standards
 */
function getLuminance(hex: string): number {
    // Remove # if present
    const cleanHex = hex.replace("#", "");
    
    // Convert to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Suggests black or white text color based on background color
 * Returns "#000000" for light backgrounds, "#FFFFFF" for dark backgrounds
 */
export function suggestTextColor(bgColor: string): string {
    if (!bgColor || !bgColor.startsWith("#")) {
        return "#000000"; // Default to black if invalid
    }

    // Ensure we have a 6-digit hex color
    let hex = bgColor.replace("#", "");
    if (hex.length === 3) {
        // Expand shorthand hex (e.g., #FFF -> #FFFFFF)
        hex = hex
            .split("")
            .map((char) => char + char)
            .join("");
    }
    if (hex.length !== 6) {
        return "#000000"; // Default to black if invalid
    }

    const fullHex = `#${hex}`;
    const luminance = getLuminance(fullHex);

    // Use a threshold of 0.5 (midpoint)
    // Lighter backgrounds (luminance > 0.5) get black text
    // Darker backgrounds (luminance <= 0.5) get white text
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

