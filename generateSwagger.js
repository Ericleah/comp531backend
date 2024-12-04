const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RiceBook API',
      version: '1.0.0',
      description: 'RiceBook 后端 API 文档',
    },
  },
  apis: ['./src/*.js'], // 替换为实际的 API 文件路径
};

const swaggerSpec = swaggerJsdoc(options);

// 将生成的 OpenAPI 规范保存为 YAML 或 JSON 文件
fs.writeFileSync('./swagger-output.json', JSON.stringify(swaggerSpec, null, 2));
console.log('Swagger JSON 文件已生成：swagger-output.json');
