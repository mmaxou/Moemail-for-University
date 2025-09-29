export const EMAIL_CONFIG = {
  MAX_ACTIVE_EMAILS: 1, // Maximum number of active emails (default 1 email allowed)
  POLL_INTERVAL: 10_000, // Polling interval in milliseconds
} as const

export type EmailConfig = typeof EMAIL_CONFIG 