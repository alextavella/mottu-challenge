# 📘 Mini Ledger

Sistema de registro de movimentações financeiras (Mini Ledger) desenvolvido com **Clean Architecture**, **Fastify**, **TypeScript**, **Prisma** e **PostgreSQL**.

## 🚀 Tecnologias

- **Node.js 22+** com **TypeScript**
- **Fastify** - Framework web moderno e rápido
- **Prisma** - ORM para PostgreSQL
- **Zod** - Validação de schemas
- **PostgreSQL** - Banco de dados
- **RabbitMQ** - Message broker para eventos
- **Docker** - Containerização
- **pnpm** - Package manager (mais rápido e eficiente)
- **Vitest** - Framework de testes

## 📋 Pré-requisitos

- Node.js 22.x (LTS)
- Docker e Docker Compose
- pnpm (recomendado)

## 🛠️ Setup do Projeto

### 1. Clone e configure Node.js

```bash
# Clone o repositório
git clone <repository-url>
cd mottu-challenge

# Se estiver usando nvm, use a versão LTS especificada
nvm use

# Ou instale manualmente o Node.js 22.x LTS
# https://nodejs.org/en/download/

# Verifique a versão do Node.js
node --version  # Deve ser v22.x.x

# Instale o pnpm globalmente (se ainda não tiver)
npm install -g pnpm

# Instale as dependências
pnpm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# RabbitMQ Connection
RABBITMQ_URL=amqp://localhost
RABBITMQ_EXCHANGE=events
RABBITMQ_RECONNECT_ATTEMPTS=5
RABBITMQ_RECONNECT_DELAY=5000
RABBITMQ_HEARTBEAT=60

# Event System
EVENTS_ENABLE_RETRY=true
EVENTS_RETRY_ATTEMPTS=3
EVENTS_RETRY_DELAY=5000
```

**Configurações do RabbitMQ:**

- `RABBITMQ_URL`: URL de conexão com RabbitMQ (padrão: amqp://localhost)
- `RABBITMQ_EXCHANGE`: Nome do exchange para eventos (padrão: events)
- `RABBITMQ_RECONNECT_ATTEMPTS`: Tentativas de reconexão (padrão: 5)
- `RABBITMQ_RECONNECT_DELAY`: Delay entre tentativas em ms (padrão: 5000)
- `RABBITMQ_HEARTBEAT`: Heartbeat da conexão em segundos (padrão: 60)

**Sistema de Eventos:**

- `EVENTS_ENABLE_RETRY`: Habilita retry automático (padrão: true)
- `EVENTS_RETRY_ATTEMPTS`: Número de tentativas de retry (padrão: 3)
- `EVENTS_RETRY_DELAY`: Delay entre tentativas em ms (padrão: 5000)

### 3. Inicie os serviços com Docker

```bash
# Inicie todos os serviços (PostgreSQL, RabbitMQ, Migrations e App)
docker-compose up -d

# Ou inicie apenas a infraestrutura (sem a aplicação)
docker-compose up -d postgres rabbitmq pgadmin

# Verifique se os serviços estão rodando
docker-compose ps
```

### 4. Configure o banco de dados

```bash
# Gere o cliente Prisma (OBRIGATÓRIO - deve ser executado primeiro)
pnpm db:generate

# Execute as migrations (desenvolvimento)
pnpm db:migrate

# Ou execute as migrations via Docker
pnpm docker:migrate

# (Opcional) Abra o Prisma Studio para visualizar os dados
pnpm db:studio
```

### 5. Inicie a aplicação

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev                # Inicia em modo desenvolvimento com hot-reload

# Build e Produção
pnpm build              # Compila o TypeScript
pnpm start              # Inicia a aplicação compilada

# Qualidade de Código
pnpm type-check         # Verifica tipos TypeScript
pnpm lint               # Executa ESLint
pnpm lint:check         # Verifica ESLint sem correções
pnpm format             # Formata código com Prettier
pnpm format:check       # Verifica formatação

# Banco de Dados
pnpm db:generate        # Gera cliente Prisma
pnpm db:migrate         # Executa migrations em desenvolvimento
pnpm db:deploy          # Executa migrations em produção
pnpm db:studio          # Abre Prisma Studio
pnpm db:seed            # Executa seeds do banco

# Docker
pnpm docker:up          # Inicia containers
pnpm docker:down        # Para containers
pnpm docker:logs        # Visualiza logs da aplicação
pnpm docker:build       # Build dos containers
pnpm docker:migrate     # Executa migrations via Docker

# Testes
pnpm test               # Executa testes em modo watch
pnpm test:run           # Executa todos os testes uma vez
pnpm test:watch         # Executa testes em modo watch
pnpm test:ui            # Interface visual dos testes
pnpm test:coverage      # Executa testes com cobertura

# Git Hooks
pnpm commit             # Commit interativo com Commitizen
```

## 🌐 Endpoints da API

### 📖 Documentação

- `GET /docs` - Interface Swagger UI (documentação interativa)
- `GET /docs/json` - Especificação OpenAPI em JSON
- `GET /docs/yaml` - Especificação OpenAPI em YAML

### Health Check

- `GET /health` - Verifica status da aplicação, banco de dados e RabbitMQ
  - Retorna 200 se todos os serviços estão saudáveis
  - Retorna 503 se algum serviço está com problemas
  - Inclui tempo de resposta de cada serviço

### Accounts

- `POST /accounts` - Cria uma nova conta
- `GET /accounts/:id/balance` - Consulta saldo e limite

### Movements

- `POST /movements` - Cria um movimento (crédito/débito)

## 🧪 Testes

O projeto utiliza **Vitest** como framework de testes, proporcionando execução rápida e funcionalidades modernas.

### Comandos de Teste

```bash
# Executar todos os testes
pnpm test:run

# Executar testes em modo watch
pnpm test:watch

# Executar com interface visual
pnpm test:ui

# Executar com relatório de cobertura
pnpm test:coverage
```

### Status Atual

- ✅ **Cobertura configurada** (HTML + JSON + Text)
- ✅ **Testes unitários** (domain, core, http)
- ✅ **Testes de integração** (E2E)
- ✅ **Testes de erros de domínio**
- ✅ **Testes de tipos de eventos**
- ✅ **Testes de casos de uso**
- ✅ **Testes de race conditions**

Para mais detalhes, consulte [docs/TESTS.md](./docs/TESTS.md).

## 🐳 Serviços Docker

O projeto inclui os seguintes serviços:

- **PostgreSQL** - Porta 5432 (com health check)
- **RabbitMQ** - Porta 5672 (AMQP) e 15672 (Management UI) (com health check)
- **PgAdmin** - Porta 5050 (Interface web para PostgreSQL)
- **Migrations** - Executa automaticamente as migrations do Prisma
- **App** - Aplicação principal (Porta 3000)

### Acessos:

- **Aplicação**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/docs
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **PgAdmin**: http://localhost:5050 (admin@admin.com/admin)

### Health Checks:

- **PostgreSQL**: Verifica se o banco está pronto para conexões
- **RabbitMQ**: Verifica conectividade das portas AMQP
- **App**: Aguarda PostgreSQL e RabbitMQ estarem saudáveis antes de iniciar

## 🧪 Desenvolvimento

### Executar em modo desenvolvimento

```bash
pnpm dev
```

### Verificar tipos e qualidade do código

```bash
pnpm type-check
pnpm lint
pnpm format
```

## 📦 Deploy

1. Configure as variáveis de ambiente de produção
2. Execute o build: `pnpm build`
3. Execute as migrations: `pnpm db:deploy`
4. Inicie a aplicação: `pnpm start`

## 🔧 Git Hooks & Commits Semânticos

Este projeto utiliza **Husky** para git hooks e **Commitizen** para commits semânticos.

### Como fazer commits

```bash
# Commit interativo (recomendado)
pnpm commit

# Commit manual
git commit -m "feat: nova funcionalidade"
```

### Tipos básicos de commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `chore`: Manutenção

### Hooks configurados

- **Pre-commit**: Executa type-check, lint e format
- **Commit-msg**: Valida formato do commit

## 📝 TODO

- [x] Implementar serviços de Account e Movement
- [x] Implementar integração com RabbitMQ
- [x] Implementar consumer para LedgerLog
- [x] Configurar Vitest e testes básicos
- [x] Expandir cobertura de testes unitários e de integração
- [x] Implementar tratamento de erros e retry
- [x] Adicionar documentação Swagger
- [x] Implementar Clean Architecture
- [x] Adicionar health checks no Docker
- [x] Implementar testes de race condition
- [x] Melhorar sistema de eventos com retry e DLQ
- [x] Adicionar scripts de limpeza e setup
