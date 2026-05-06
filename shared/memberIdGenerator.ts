/**
 * Member ID Generator
 * Format: [Gender]-[Month]-[Year]-[Order]
 * Example: 1-05-26-0002 (Male, May 2026, 2nd member)
 * Returns as concatenated number: 105260002
 */

/**
 * Generate a member ID based on gender and date
 * @param gender - "1" for Male, "2" for Female, "3" for Other/Institution
 * @param date - The date of inscription (defaults to current date)
 * @param orderNumber - The order number (1-based)
 * @returns The member ID in format: 105260002
 */
export function generateMemberId(
  gender: "1" | "2" | "3",
  date: Date = new Date(),
  orderNumber: number = 1
): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const order = String(orderNumber).padStart(4, "0");

  // Format: 1-05-26-0002 -> 105260002
  return `${gender}${month}${year}${order}`;
}

/**
 * Format a member ID for display
 * Input: 105260002 -> Output: 1-05-26-0002
 */
export function formatMemberId(memberId: string): string {
  if (memberId.length !== 8) return memberId;
  return `${memberId[0]}-${memberId.slice(1, 3)}-${memberId.slice(3, 5)}-${memberId.slice(5)}`;
}

/**
 * Parse a member ID to extract components
 */
export function parseMemberId(memberId: string): {
  gender: "1" | "2" | "3";
  month: number;
  year: number;
  order: number;
} | null {
  if (memberId.length !== 8) return null;

  const gender = memberId[0] as "1" | "2" | "3";
  const month = parseInt(memberId.slice(1, 3), 10);
  const year = parseInt(memberId.slice(3, 5), 10);
  const order = parseInt(memberId.slice(5), 10);

  if (month < 1 || month > 12 || order < 1 || order > 9999) return null;

  return { gender, month, year, order };
}

/**
 * Get gender label
 */
export function getGenderLabel(gender: "1" | "2" | "3"): string {
  switch (gender) {
    case "1":
      return "Homme";
    case "2":
      return "Femme";
    case "3":
      return "Autre/Institution";
    default:
      return "Inconnu";
  }
}
