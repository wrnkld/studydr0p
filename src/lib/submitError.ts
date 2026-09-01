const GONE_MESSAGE = "Sorry, this study no longer exists.";

/**
 * Turns a raw database error from a participant submission into copy a
 * participant can actually understand. A missing parent study shows up either
 * as a foreign-key violation or as a row-level-security rejection.
 */
export function submitErrorMessage(error: { code?: string; message?: string } | null): string {
  if (!error) return GONE_MESSAGE;
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (
    code === "23503" ||
    code === "42501" ||
    /foreign key/i.test(message) ||
    /row-level security/i.test(message)
  ) {
    return GONE_MESSAGE;
  }
  return message || "Something went wrong. Please try again.";
}
