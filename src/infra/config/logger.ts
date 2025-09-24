export interface ILogger {
  info(message: string): void;
  error(message: string, error?: Error | unknown): void;
  warn(message: string): void;
  debug(message: string): void;
}
