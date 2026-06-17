import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { config } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Avitus Anketa API',
      version: '1.0.0',
      description: 'HR Telegram anketa tizimi REST API',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
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
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../presentation/routes/*.ts'),
    path.join(__dirname, '../presentation/routes/*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
