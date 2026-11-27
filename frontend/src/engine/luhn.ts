/**
 * Luhn Algorithm (Modulus 10) for Credit / Debit Card validation
 * Used by ISO/IEC 7812-1 to distinguish valid card candidate numbers
 * from random 16-digit reference numbers, tracking IDs, or timestamps.
 */
export function isValidLuhn(input: string): boolean {
  // Strip non-digit characters (spaces, dashes)
  const cleanDigits = input.replace(/\D/g, '');

  // Payment cards are typically between 13 and 19 digits
  if (cleanDigits.length < 13 || cleanDigits.length > 19) {
    return false;
  }

  // Reject repeating single digits like 0000000000000000
  if (/^(\d)\1+$/.test(cleanDigits)) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  // Process digits from right to left
  for (let i = cleanDigits.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanDigits.charAt(i), 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}
