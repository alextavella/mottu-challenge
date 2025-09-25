/**
 * Generic function to wait for RabbitMQ to process messages with retries
 * @param delay - Base delay in milliseconds (default: 2000)
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Promise that resolves after processing
 */
export async function waitForEventProcessing(
  delay: number = 5000,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delay));
}
