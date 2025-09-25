/**
 * Generic function to wait for RabbitMQ to process messages with retries
 * @param delay - Base delay in milliseconds (default: 1000)
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Promise that resolves after processing
 */
export async function waitForEventProcessing(
  delay: number = 1000,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Fast event processing wait for unit tests or simple operations
 * @returns Promise that resolves after minimal processing time
 */
export async function waitForEventProcessingFast(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
