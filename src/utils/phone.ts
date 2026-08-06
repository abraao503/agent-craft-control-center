import {
  parsePhoneNumber,
  isValidPhoneNumber as libIsValidPhoneNumber,
} from "libphonenumber-js";

/**
 * Meta can send Brazilian mobile numbers without the ninth digit. Keep the
 * frontend display and outbound normalization aligned with the API rule.
 */
const canonicalizeBrazilianMobile = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  const subscriber = digits.slice(4);

  if (
    digits.startsWith("55") &&
    digits.length === 12 &&
    /^[6-9]/.test(subscriber)
  ) {
    return `${digits.slice(0, 4)}9${subscriber}`;
  }

  return digits;
};

/**
 * Format phone number for display (supports international numbers)
 *
 * - Brazilian numbers: displayed in national format "(11) 99988-7766"
 * - International numbers: displayed in international format "+1 650 555 1234"
 *
 * The phone parameter is expected in E.164 format WITHOUT "+" (as stored/returned by the backend).
 * Examples: "5511999887766", "16505551234", "447911123456"
 *
 * @param phone - Phone number string (E.164 without "+")
 * @param showDDI - Whether to always show the DDI (country code) - defaults to false
 * @returns Formatted phone number or original string if format is invalid
 */
export const formatPhone = (
  phone: string,
  showDDI: boolean = false,
): string => {
  if (!phone) return phone;

  try {
    const parsed = parsePhoneNumber(
      `+${canonicalizeBrazilianMobile(phone)}`,
    );
    if (!parsed) return phone;

    // Brazilian numbers: national format by default
    if (parsed.country === "BR" && !showDDI) {
      return parsed.formatNational();
    }

    // International numbers or when DDI is explicitly requested
    return parsed.formatInternational();
  } catch {
    // Fallback for invalid/unparseable numbers
    return phone;
  }
};

/**
 * Validate a phone number (supports international numbers)
 *
 * Accepts numbers with or without "+". Numbers without country code
 * are assumed to be Brazilian (BR fallback).
 *
 * @param phone - Phone number string to validate
 * @returns Whether the phone number is valid
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;

  try {
    // If already starts with "+", validate directly
    if (phone.startsWith("+")) {
      return libIsValidPhoneNumber(phone);
    }

    // Try with "+" prefix first (E.164 format without "+")
    if (libIsValidPhoneNumber(`+${phone}`)) {
      return true;
    }

    // Fallback: assume Brazilian number
    return libIsValidPhoneNumber(phone, "BR");
  } catch {
    return false;
  }
};

/**
 * Normalize a phone number to E.164 format WITH "+"
 * (the format expected when sending to the backend API)
 *
 * @param phone - Phone number string (can include formatting, spaces, etc.)
 * @returns E.164 string with "+" prefix (e.g. "+5511999887766") or digits-only fallback
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return phone;

  try {
    const digits = canonicalizeBrazilianMobile(phone);

    // If starts with "+", parse directly
    if (phone.startsWith("+")) {
      const parsed = parsePhoneNumber(`+${digits}`);
      if (parsed) {
        return parsed.format("E.164");
      }
    }

    // Try parsing as international (with "+" prefix)
    const parsedWithPlus = parsePhoneNumber(`+${digits}`);
    if (parsedWithPlus?.isValid()) {
      return parsedWithPlus.format("E.164");
    }

    // Fallback: assume Brazilian number
    const parsed = parsePhoneNumber(digits, "BR");
    if (parsed) {
      return parsed.format("E.164");
    }
  } catch {
    // Return digits only as fallback
  }

  return `+${canonicalizeBrazilianMobile(phone)}`;
};

/**
 * Get customer display label
 * Prioritizes name > phone > identifier > id
 *
 * @param customer - Customer object with name, phone, identifier, and id
 * @returns Display label for the customer
 */
export const getCustomerLabel = (customer: {
  name?: string;
  phone?: string;
  identifier?: string;
  id: string;
}): string => {
  if (customer.name) return customer.name;
  if (customer.phone) return formatPhone(customer.phone);
  return customer.identifier || customer.id;
};
