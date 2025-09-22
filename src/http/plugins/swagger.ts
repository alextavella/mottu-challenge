import swagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

export function swaggerPlugin(
  fastify: FastifyInstance,
  options?: FastifyDynamicSwaggerOptions,
) {
  const swaggerOptions: FastifyDynamicSwaggerOptions = {
    openapi: {
      info: {
        title: 'Mini Ledger API',
        description: 'API for Mini Ledger',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    ...options,
  };

  fastify.register(swagger, swaggerOptions);

  fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
}
