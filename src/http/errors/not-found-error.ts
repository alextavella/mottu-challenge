import { HttpError } from './http-error';

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
    this.name = this.constructor.name;
  }
}
