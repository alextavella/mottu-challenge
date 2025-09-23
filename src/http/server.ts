import { env } from '@/config/env';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { errorHandler } from './middlewares/error-handler';
import { swaggerPlugin } from './plugins/swagger';
import { routes } from './routes';

export function createServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      enabled: env.NODE_ENV === 'test' ? false : true,
    },
  });

  // Set up Zod validation and serialization
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Register CORS
  fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Register Swagger
  swaggerPlugin(fastify, {
    transform: jsonSchemaTransform,
  });

  // Set error handler
  fastify.setErrorHandler(errorHandler);

  // Register routes
  fastify.register(routes);

  return fastify;
}
