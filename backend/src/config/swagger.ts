import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const extension = __filename.endsWith('.ts') ? 'ts' : 'js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AML Alert Triage & Investigation System API',
      version: '1.0.0',
      description: 'Backend API for AML alert triage, investigation, and risk monitoring',
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
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
    path.join(__dirname, `../routes/*.${extension}`),
    path.join(__dirname, '../docs/swagger.yaml'),
  ],
};

export default swaggerJsdoc(options);
