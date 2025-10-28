const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    version: '1.0.0',
    title: 'HRX API - Documentação Completa',
    description: 'Documentação automática de todas as 75 rotas da API HRX. Gerado para análise e auditoria.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Desenvolvimento',
    },
    {
      url: 'https://hrx.vercel.app',
      description: 'Produção',
    },
  ],
  tags: [
    { name: 'Admin - Professionals', description: 'Gerenciamento de profissionais' },
    { name: 'Admin - Event Projects', description: 'Gerenciamento de projetos' },
    { name: 'Admin - Suppliers', description: 'Gerenciamento de fornecedores' },
    { name: 'Admin - Categories', description: 'Categorias e tipos' },
    { name: 'Admin - Users', description: 'Gerenciamento de usuários' },
    { name: 'Admin - Geocoding', description: 'Geocodificação e mapas' },
    { name: 'Admin - Email', description: 'Configuração de emails' },
    { name: 'Admin - Deliveries', description: 'Rastreamento de entregas' },
    { name: 'Professional', description: 'APIs do profissional' },
    { name: 'Contractor', description: 'APIs do contratante' },
    { name: 'Supplier', description: 'APIs do fornecedor' },
    { name: 'Public', description: 'APIs públicas' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT do Clerk',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  './src/app/api/**/route.ts',
  './src/app/api/**/**/route.ts',
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(({ success, data }) => {
  console.log('✅ Swagger gerado com sucesso!');
  console.log(`📁 Arquivo: ${outputFile}`);
  console.log(`📊 Total de rotas documentadas: ${Object.keys(data.paths || {}).length}`);
});
