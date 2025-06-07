/**
 * Converts a UTF-8 string to a hex string.
 * @param str The input string.
 * @returns Hexadecimal representation of the string.
 */
export function stringToHex(str: string): string {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}