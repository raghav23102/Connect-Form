import crypto from "crypto";

/**
 * Generate a unique Connect Form ID
 * Format: connect-form-XXXXXX (6 uppercase alphanumeric chars)
 */
export function generateFormId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `connect-form-${result}`;
}

/**
 * Generate a unique Submission ID
 * Format: sub-XXXXXX-TIMESTAMP
 */
export function generateSubmissionId(formId: string): string {
  const shortCode = formId.replace("connect-form-", "");
  const timestamp = Date.now().toString(36).toUpperCase();
  return `sub-${shortCode}-${timestamp}`;
}

/**
 * Generate a secure unique ID for database records
 */
export function generateId(): string {
  return crypto.randomUUID();
}
