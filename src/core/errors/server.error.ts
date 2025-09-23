export class ServerError extends Error {
  public readonly originalError?: Error;

  constructor(message: string);
  constructor(originalError: Error);
  constructor(message: string, originalError: Error);
  constructor(messageOrError: string | Error, originalError?: Error) {
    if (typeof messageOrError === 'string') {
      super(messageOrError);
      this.originalError = originalError;
    } else {
      super(messageOrError.message);
      this.originalError = messageOrError;
    }
    this.name = 'SERVER_ERROR';
  }
}

export function throwServerError(message: string) {
  return (originalError: Error) => {
    throw new ServerError(message, originalError);
  };
}
