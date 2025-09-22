import { env } from '@/config/env';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';
import { HttpError } from '../errors/http-error';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error(error);

  // Zod validation errors
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: "Request doesn't match the schema",
      statusCode: 400,
      details: {
        issues: error.validation,
        method: request.method,
        url: request.url,
      },
    });
  }

  // Zod response serialization errors
  if (isResponseSerializationError(error)) {
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: "Response doesn't match the schema",
      statusCode: 500,
      details: {
        issues: error.cause.issues,
        method: error.method,
        url: error.url,
      },
    });
  }

  // Http errors
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // Default error handling
  const statusCode = error.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message;

  return reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
    message,
    statusCode,
  });
}
