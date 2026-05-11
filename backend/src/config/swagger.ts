import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CercaYa API Documentation',
      version: '1.0.0',
      description: 'Documentación oficial de la API de CercaYa. Conecta vendedores locales con clientes.',
      contact: {
        name: 'Soporte CercaYa',
        url: 'https://cercaya.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desarrollo Local',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/schemas/*.ts'], // Rutas donde buscar anotaciones
};

export const swaggerSpec = swaggerJsdoc(options);
