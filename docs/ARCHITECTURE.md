# Arquitetura e Boas Práticas - Mini Ledger

## 📋 Visão Geral

O Mini Ledger é uma API REST desenvolvida com **Fastify** e **TypeScript** que implementa um sistema de registro de movimentações financeiras seguindo princípios de arquitetura limpa e boas práticas de desenvolvimento.

## 🏗️ Arquitetura

### Stack Tecnológica

- **Runtime**: Node.js 22+
- **Framework**: Fastify 5.x
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Validação**: Zod
- **Documentação**: Swagger/OpenAPI
- **Containerização**: Docker + Docker Compose
- **Gerenciador de Pacotes**: pnpm

### Estrutura de Diretórios

```
src/
├── app.ts                 # Ponto de entrada da aplicação
├── config/               # Configurações da aplicação
│   └── env.ts           # Validação de variáveis de ambiente
├── database/            # Configuração e client do banco
│   ├── client.ts       # Cliente Prisma
│   └── seed.ts         # Scripts de seed
├── http/               # Camada HTTP
│   ├── errors/         # Classes de erro customizadas
│   ├── middlewares/    # Middlewares do Fastify
│   ├── plugins/        # Plugins do Fastify
│   ├── routes/         # Definição das rotas
│   └── server.ts       # Configuração do servidor
```

## 🎯 Princípios Arquiteturais

### 1. Separação de Responsabilidades

- **`app.ts`**: Orquestração da inicialização e graceful shutdown
- **`server.ts`**: Configuração do servidor HTTP e middlewares
- **`routes/`**: Definição de endpoints e handlers
- **`config/`**: Centralização de configurações
- **`database/`**: Abstração da camada de dados

### 2. Type Safety

- **TypeScript** em toda a aplicação
- **Zod** para validação de schemas em runtime
- **Prisma** para type-safe database queries
- **fastify-type-provider-zod** para integração entre Fastify e Zod

### 3. Validação Robusta

```typescript
// Exemplo de schema de validação
const createAccountBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  document: z.string().min(11, 'Documento deve ter pelo menos 11 caracteres'),
  email: z.email('Email deve ser válido'),
});
```

### 4. Error Handling Centralizado

- Middleware global de tratamento de erros
- Classes de erro customizadas (`HttpError`, `BadRequestError`, etc.)
- Diferentes comportamentos para desenvolvimento e produção

## 🔧 Configuração e Environment

### Variáveis de Ambiente

```typescript
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  RABBITMQ_URL: z.url().optional(),
});
```

### Configuração do Servidor

- **Logging**: Configurado por ambiente (debug em dev, info em prod)
- **CORS**: Habilitado para desenvolvimento
- **Swagger**: Documentação automática da API
- **Graceful Shutdown**: Desconexão limpa do banco de dados

## 🗄️ Modelo de Dados

### Entidades Principais

```prisma
model Account {
  id           String   @id @default(uuid())
  name         String
  document     String   @unique
  email        String   @unique
  balance      Decimal  @default(1000) @db.Decimal(15, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  movements    Movement[]
}

model Movement {
  id          String       @id @default(uuid())
  accountId   String
  amount      Decimal      @db.Decimal(15, 2)
  type        MovementType
  description String?
  createdAt   DateTime     @default(now())
  account     Account      @relation(fields: [accountId], references: [id])
}

model LedgerLog {
  id          String   @id @default(uuid())
  movementId  String
  accountId   String
  amount      Decimal  @db.Decimal(15, 2)
  type        String
  data        Json?
  processedAt DateTime @default(now())
}
```

## 🚀 Boas Práticas Implementadas

### 1. **Code Quality**

- **ESLint + Prettier**: Formatação e linting automático
- **TypeScript Strict Mode**: Verificação rigorosa de tipos
- **Husky + Commitlint**: Git hooks para qualidade de commits
- **Conventional Commits**: Padronização de mensagens de commit

### 2. **Segurança**

- Validação rigorosa de entrada com Zod
- Sanitização automática de dados
- Tratamento seguro de erros (não exposição de stack traces em produção)
- Uso de UUIDs para identificadores

### 3. **Performance**

- **Fastify**: Framework de alta performance
- **Prisma**: Queries otimizadas e connection pooling
- **Decimal.js**: Precisão matemática para valores monetários
- **Graceful Shutdown**: Finalização limpa de conexões

### 4. **Observabilidade**

- **Structured Logging**: Logs estruturados com níveis apropriados
- **Error Tracking**: Logging detalhado de erros
- **Health Check**: Endpoint de verificação de saúde da aplicação
- **Swagger Documentation**: Documentação automática da API

### 5. **Development Experience**

- **Hot Reload**: Desenvolvimento com `tsx watch`
- **Path Mapping**: Imports absolutos com `@/`
- **Type Checking**: Verificação de tipos separada do build
- **Database Tools**: Prisma Studio para visualização de dados

### 6. **Deployment**

- **Docker**: Containerização da aplicação
- **Multi-stage Build**: Otimização de imagem Docker
- **Health Checks**: Verificação de saúde para orquestradores
- **Environment Variables**: Configuração por ambiente

## 🔄 Fluxo de Desenvolvimento

### 1. **Setup Local**

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
pnpm db:migrate
pnpm db:seed

# Iniciar desenvolvimento
pnpm dev
```

### 2. **Workflow de Desenvolvimento**

1. **Feature Branch**: Criar branch a partir de `main`
2. **Development**: Usar `pnpm dev` para hot reload
3. **Quality Check**: `pnpm lint`, `pnpm type-check`, `pnpm format:check`
4. **Testing**: Testar endpoints com arquivos `.http`
5. **Commit**: Usar `pnpm commit` para conventional commits
6. **Pull Request**: Merge para `main` após review

### 3. **Scripts Disponíveis**

```json
{
  "dev": "tsx watch src/app.ts", // Desenvolvimento
  "build": "tsup src --out-dir dist", // Build para produção
  "start": "node dist/app.js", // Iniciar produção
  "db:migrate": "prisma migrate dev", // Migrations
  "db:studio": "prisma studio", // GUI do banco
  "lint": "eslint src --ext .ts --fix", // Linting
  "format": "prettier --write .", // Formatação
  "commit": "cz" // Commit interativo
}
```

## 📊 Monitoramento

### Logs Estruturados

```typescript
app.log.info('Database connected successfully');
app.log.error(error);
```

### Health Check

- **Endpoint**: `GET /health`
- **Verificações**: Status da aplicação e conectividade
- **Uso**: Load balancers, monitoring tools

### Swagger Documentation

- **Endpoint**: `/docs`
- **Conteúdo**: Documentação interativa da API
- **Schemas**: Validação de entrada e saída documentada

## 🔒 Considerações de Segurança

1. **Validação de Entrada**: Todos os inputs são validados com Zod
2. **Error Handling**: Stack traces não são expostos em produção
3. **Database**: Uso de prepared statements via Prisma
4. **CORS**: Configurado apropriadamente por ambiente
5. **Logs**: Informações sensíveis não são logadas

## 🚀 Próximos Passos

1. **Testes**: Implementar testes unitários e de integração
2. **Autenticação**: Adicionar sistema de autenticação/autorização
3. **Rate Limiting**: Implementar limitação de requisições
4. **Caching**: Adicionar cache para queries frequentes
5. **Monitoring**: Integrar ferramentas de APM
6. **CI/CD**: Configurar pipeline de deploy automatizado

---

Esta arquitetura foi projetada para ser **escalável**, **maintível** e **robusta**, seguindo as melhores práticas da comunidade Node.js e TypeScript.
