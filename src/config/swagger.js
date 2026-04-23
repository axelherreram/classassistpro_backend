const swaggerJSDoc = require('swagger-jsdoc');
require('dotenv').config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentación CLASSASSIST',
      version: '1.0.0',
      description: 'Documentación de la capa de Backend y API para el sistema de control de clases, asistencia y participación.',
      contact: {
        name: 'Soporte ClassAssist'
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor Local'
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
        bearerAuth: []
      }
    ],
  },
  apis: [
    './src/routes/*.js',
  ]
};

const specs = swaggerJSDoc(options);

module.exports = specs;
