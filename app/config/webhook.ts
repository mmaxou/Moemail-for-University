export const WEBHOOK_CONFIG = {
  MAX_RETRIES: 3, // Maximum retry count
  TIMEOUT: 10_000, // Timeout time (milliseconds)
  RETRY_DELAY: 1000, // Retry delay (milliseconds)
  EVENTS: {
    NEW_MESSAGE: 'new_message',
  }
} as const

export type WebhookConfig = typeof WEBHOOK_CONFIG 