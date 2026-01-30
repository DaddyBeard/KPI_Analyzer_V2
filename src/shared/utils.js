/**
 * Utility functions for security and shared logic
 */

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this when ensuring user-provided strings are safe to inject via innerHTML.
 * @param {string} str - The raw string to escape
 * @returns {string} - The escaped string safe for HTML rendering
 */
export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
