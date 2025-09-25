import amqp, { Channel, ChannelModel } from 'amqplib';
import { ILogger } from '../config/logger';
import { ConnectionOptions as RabbitMQConnectionOptions } from './types';

export class RabbitMQConnection {
  private connection: ChannelModel | null = null;
  private channels: Map<string, Channel> = new Map();
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private options: RabbitMQConnectionOptions,
    private logger: ILogger,
  ) {}

  async connect(): Promise<ChannelModel> {
    if (this.connection) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Wait for the current connection attempt to complete
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.connection) {
            resolve(this.connection);
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    try {
      this.logger.info(`Connecting to RabbitMQ at ${this.options.url}...`);

      this.connection = await amqp.connect(this.options.url, {
        heartbeat: this.options.heartbeat || 60,
      });

      this.setupConnectionHandlers();
      this.logger.info('Successfully connected to RabbitMQ');

      this.isConnecting = false;
      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      this.logger.error('Failed to connect to RabbitMQ:', error);

      if (
        this.options.reconnectAttempts &&
        this.options.reconnectAttempts > 0
      ) {
        this.scheduleReconnect();
      }

      throw error;
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.on('error', (error: Error) => {
      this.logger.error('RabbitMQ connection error:', error);
      this.connection = null;
      this.channels.clear();
      this.scheduleReconnect();
    });

    this.connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.connection = null;
      this.channels.clear();
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.options.reconnectDelay || 5000;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnection failed:', error);
      }
    }, delay);
  }

  async createChannel(channelId?: string): Promise<Channel> {
    const connection = await this.connect();

    if (channelId && this.channels.has(channelId)) {
      const existingChannel = this.channels.get(channelId)!;
      // Check if channel is still open
      if (existingChannel && !existingChannel.connection) {
        this.channels.delete(channelId);
      } else {
        return existingChannel;
      }
    }

    const channel = await connection.createChannel();

    channel.on('error', (error: Error) => {
      this.logger.error(
        `Channel error${channelId ? ` for ${channelId}` : ''}:`,
        error,
      );
      if (channelId) {
        this.channels.delete(channelId);
      }
    });

    channel.on('close', () => {
      this.logger.warn(`Channel closed${channelId ? ` for ${channelId}` : ''}`);
      if (channelId) {
        this.channels.delete(channelId);
      }
    });

    if (channelId) {
      this.channels.set(channelId, channel);
    }

    return channel;
  }

  async close(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close all channels
    for (const [channelId, channel] of this.channels) {
      try {
        await channel.close();
      } catch (error) {
        this.logger.error(`Error closing channel ${channelId}:`, error);
      }
    }
    this.channels.clear();

    // Close connection
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        this.logger.error('Error closing RabbitMQ connection:', error);
      }
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}
