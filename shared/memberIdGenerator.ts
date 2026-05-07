/**
 * Member ID Generator
 * Format: [Gender]-[MM]-[YY]-[Order]
 * Example: 1-05-26-0002
 * 
 * Gender codes:
 * 1 = Male (Homme)
 * 2 = Female (Femme)
 * 3 = Other (Autre/Institution)
 */

export type Gender = "male" | "female" | "other";

const GENDER_CODES: Record<Gender, string> = {
  male: "1",
  female: "2",
  other: "3",
};

/**
 * Generate a member ID based on gender and registration date
 * @param gender - Gender of the member (male, female, other)
 * @param registrationDate - Date of registration
 * @param orderNumber - Sequential order number (1-9999)
 * @returns Formatted member ID (e.g., "1-05-26-0002")
 */
export function generateMemberId(
  gender: Gender,
  registrationDate: Date,
  orderNumber: number
): string {
  const genderCode = GENDER_CODES[gender];
  const month = String(registrationDate.getMonth() + 1).padStart(2, "0");
  const year = String(registrationDate.getFullYear()).slice(-2);
  const order = String(orderNumber).padStart(4, "0");

  return `${genderCode}-${month}-${year}-${order}`;
}

/**
 * Parse a member ID to extract its components
 * @param memberId - Member ID to parse (e.g., "1-05-26-0002")
 * @returns Object with gender, month, year, and order
 */
export function parseMemberId(memberId: string) {
  const parts = memberId.split("-");
  if (parts.length !== 4) {
    throw new Error(`Invalid member ID format: ${memberId}`);
  }

  const genderCode = parts[0];
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  const order = parseInt(parts[3], 10);

  // Reverse lookup gender code
  let gender: Gender = "other";
  for (const [key, code] of Object.entries(GENDER_CODES)) {
    if (code === genderCode) {
      gender = key as Gender;
      break;
    }
  }

  return {
    gender,
    month,
    year,
    order,
    genderCode,
  };
}

/**
 * Validate a member ID format
 * @param memberId - Member ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidMemberId(memberId: string): boolean {
  try {
    const parts = memberId.split("-");
    if (parts.length !== 4) return false;

    const genderCode = parts[0];
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const order = parseInt(parts[3], 10);

    // Validate gender code
    if (!Object.values(GENDER_CODES).includes(genderCode)) return false;

    // Validate month (1-12)
    if (month < 1 || month > 12) return false;

    // Validate year (00-99)
    if (year < 0 || year > 99) return false;

    // Validate order (0001-9999)
    if (order < 1 || order > 9999) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Get the next order number for a given gender and registration date
 * This function should be called with the count of existing members with the same gender and month/year
 * @param existingCount - Number of existing members with same gender and month/year
 * @returns Next order number (1-based)
 */
export function getNextOrderNumber(existingCount: number): number {
  return existingCount + 1;
}

/**
 * Format gender code to display name
 * @param gender - Gender type
 * @returns Display name (Homme, Femme, Autre)
 */
export function formatGenderDisplay(gender: Gender): string {
  const display: Record<Gender, string> = {
    male: "Homme",
    female: "Femme",
    other: "Autre",
  };
  return display[gender];
}

/**
 * Format gender code from display name
 * @param displayName - Display name (Homme, Femme, Autre)
 * @returns Gender type
 */
export function parseGenderDisplay(displayName: string): Gender {
  const mapping: Record<string, Gender> = {
    Homme: "male",
    Femme: "female",
    Autre: "other",
  };
  return mapping[displayName] || "other";
}
