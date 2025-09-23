import { DomainError } from '@/core/errors/domain.error';
import { ServerError } from '@/core/errors/server.error';
import { env } from '@/infrastructure/config/env.config';
import { HttpError } from '@/infrastructure/http/errors/http-error';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';

interface ValidationIssue {
  instancePath?: string;
  schemaPath?: string;
  keyword?: string;
  params?: unknown;
  message?: string;
  data?: unknown;
}

function formatZodErrors(issue: ValidationIssue): string {
  return issue.message || 'Erro de validação';
}

function formatZodFields(
  acc: Record<string, string>,
  issue: ValidationIssue,
): Record<string, string> {
  const fieldName = issue.instancePath?.replace('/', '') || 'root';
  const message = issue.message || 'Erro de validação';
  acc[fieldName] = message;
  return acc;
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error(error);

  // Zod validation errors
  if (hasZodFastifySchemaValidationErrors(error)) {
    const formattedErrors = error.validation.map(formatZodErrors);
    const fieldErrors = error.validation.reduce(formatZodFields, {});

    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Os dados enviados são inválidos',
      errors: formattedErrors,
      fields: fieldErrors,
    });
  }

  // Zod response serialization errors
  if (isResponseSerializationError(error)) {
    const formattedErrors = error.cause.issues.map(formatZodErrors);
    const fieldErrors = error.cause.issues.reduce(formatZodFields, {});

    return reply.status(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno na validação da resposta',
      errors: formattedErrors,
      fields: fieldErrors,
    });
  }

  // Http errors
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  // Business errors
  if (error instanceof DomainError) {
    return reply.status(400).send({
      error: error.name,
      message: error.message,
    });
  }

  // Server errors
  if (error instanceof ServerError) {
    return reply.status(500).send({
      error: error.name,
      message: error.message,
      cause: error.cause,
    });
  }

  // Default error handling
  const statusCode = error.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message;

  return reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
    message,
  });
}
