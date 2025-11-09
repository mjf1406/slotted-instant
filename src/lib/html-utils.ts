/** @format */

/**
 * Basic HTML sanitization - removes script tags and dangerous attributes
 * For production, consider using a library like DOMPurify
 */
export function sanitizeHtml(html: string): string {
    if (!html) return "";
    
    // Create a temporary div to parse HTML
    const div = document.createElement("div");
    div.innerHTML = html;
    
    // Remove script tags
    const scripts = div.querySelectorAll("script");
    scripts.forEach((script) => script.remove());
    
    // Remove event handlers from attributes
    const allElements = div.querySelectorAll("*");
    allElements.forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            if (attr.name.startsWith("on")) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    return div.innerHTML;
}

