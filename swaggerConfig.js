const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation", // 替换为你的项目名称
      version: "1.0.0",
      description: "API documentation for my project",
    },
    servers: [
      {
        url: "http://localhost:3000", // 替换为你的服务器 URL
        description: "Local server",
      },
    ],
  },
  apis: ["./src/articles.js"], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
