const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Swagger API Demo", 
      version: "1.0.0",
      description: "API documentation for my project",
    },
    servers: [
      {
        url: "http://localhost:3000", 
        description: "Local server",
      },
    ],
  },
  apis: ["./src/articles.js"], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
