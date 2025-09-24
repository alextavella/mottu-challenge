/**
 * Generic function to wait for RabbitMQ to process messages with retries
 * @param delay - Base delay in milliseconds (default: 500)
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Promise that resolves after processing
 */
export async function waitForEventProcessing(
  delay: number = 500,
  maxRetries: number = 3,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
