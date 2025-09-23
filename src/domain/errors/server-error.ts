export class ServerError extends Error {
  constructor(
    readonly cause: Error,
    message: string,
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
  }
}

export function throwServerError(message: string) {
  return (cause: Error) => {
    throw new ServerError(cause, message);
  };
}
