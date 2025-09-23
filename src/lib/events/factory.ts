import { env } from '@/config/env';
import { EventManager } from './event-manager';
import { EventManagerOptions } from './types';

function createEventManager(): EventManager {
  const options: EventManagerOptions = {
    connection: {
      url: env.RABBITMQ_URL,
      reconnectAttempts: env.RABBITMQ_RECONNECT_ATTEMPTS,
      reconnectDelay: env.RABBITMQ_RECONNECT_DELAY,
      heartbeat: env.RABBITMQ_HEARTBEAT,
    },
    defaultExchange: env.RABBITMQ_EXCHANGE,
    enableRetry: env.EVENTS_ENABLE_RETRY,
    retryAttempts: env.EVENTS_RETRY_ATTEMPTS,
    retryDelay: env.EVENTS_RETRY_DELAY,
  };

  return new EventManager(options);
}

// Global instance (singleton pattern)
let eventManagerInstance: EventManager | null = null;

export function getEventManager(): EventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = createEventManager();
  }
  return eventManagerInstance;
}

export async function shutdownEventManager(): Promise<void> {
  if (eventManagerInstance) {
    await eventManagerInstance.shutdown();
    eventManagerInstance = null;
  }
}
