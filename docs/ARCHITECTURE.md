# 🏗️ Arquitetura - Mini Ledger

## 📋 Visão Geral

API REST para sistema de movimentações financeiras implementada com **Clean Architecture** e **princípios SOLID**.

## 🛠️ Stack Tecnológica

- **Node.js 22+** + **TypeScript** + **Fastify**
- **PostgreSQL** + **Prisma ORM**
- **Zod** (validação) + **Swagger** (docs)
- **RabbitMQ** (eventos) + **Docker**

## 🏗️ Clean Architecture

### Estrutura de Camadas

```
src/
├── domain/                  # 🎯 DOMÍNIO (regras de negócio)
│   ├── entities/            # Entidades de domínio
│   ├── contracts/           # Interfaces/contratos
│   └── errors/              # Erros de domínio por contexto
├── core/                    # 🔧 CORE (casos de uso e handlers)
│   ├── events/              # Eventos de domínio
│   ├── handlers/            # Handlers de eventos
│   ├── repositories/        # Implementações de repositórios
│   └── usecases/            # Casos de uso por feature
├── http/                    # 🌐 HTTP (controllers e servidor)
│   ├── controllers/         # Controllers por feature
│   ├── errors/              # Erros HTTP
│   ├── middlewares/         # Middlewares HTTP
│   ├── plugins/             # Plugins do Fastify
│   └── routes/              # Registro de rotas
└── infra/                   # 🏗️ INFRAESTRUTURA (detalhes técnicos)
    ├── config/              # Configurações
    ├── container/           # Injeção de dependência
    ├── database/            # Cliente do banco
    └── events/              # Sistema de eventos
```

### Testes

```
tests/
├── unit/                    # Testes unitários (isolados)
│   └── core/               # Core (entities, errors, handlers, usecases)
├── integration/             # Testes de integração (E2E)
│   └── adapters/           # Controllers por feature
├── mocks/                   # Mocks por camada
│   ├── core/               # Mocks do core
│   └── infrastructure/     # Mocks da infraestrutura
├── helpers/                 # Utilitários de teste
└── http/                    # Arquivos de teste HTTP
```

## 🎯 Regras Fundamentais

### 1. Fluxo de Dependências

```
HTTP → Core → Domain
Infra → Core → Domain
```

- **Domain**: Regras de negócio puras (independente)
- **Core**: Casos de uso e implementações de repositórios
- **HTTP**: Controllers e servidor web
- **Infra**: Detalhes técnicos (DB, Events, Config)

### 2. Dependency Rule

- Dependências **sempre** apontam para dentro
- Domain **nunca** conhece detalhes externos
- Core depende apenas do Domain
- HTTP e Infra dependem do Core e Domain

### 3. SOLID Principles

- **S**: Uma responsabilidade por classe
- **O**: Aberto para extensão, fechado para modificação
- **L**: Implementações são substituíveis via interfaces
- **I**: Interfaces específicas por domínio
- **D**: Dependências via abstrações, não implementações

### 4. Features

- **Accounts**: Contas (CRUD + saldo)
- **Movements**: Movimentações (débito/crédito)
- **Health**: Status da aplicação

## 🗄️ Modelo de Dados

```prisma
model Account {
  id        String    @id @default(uuid())
  name      String
  document  String    @unique
  email     String    @unique
  balance   Decimal   @default(1000)
  movements Movement[]
}

model Movement {
  id        String      @id @default(uuid())
  accountId String
  amount    Decimal
  type      MovementType // CREDIT | DEBIT
  account   Account     @relation(fields: [accountId], references: [id])
}
```

## 🚀 Comandos Essenciais

```bash
# Desenvolvimento
pnpm install
pnpm dev                 # Servidor com hot reload
pnpm build              # Build para produção
pnpm start              # Iniciar produção

# Database
pnpm db:migrate         # Executar migrations
pnpm db:seed            # Popular dados iniciais
pnpm db:studio          # GUI do banco

# Testes
pnpm test               # Executar todos os testes
pnpm test:unit          # Apenas testes unitários
pnpm test:integration   # Apenas testes de integração

# Docker
pnpm docker:up          # Subir containers
pnpm docker:down        # Parar containers
```

## 📋 Checklist de Desenvolvimento

### ✅ Implementado

- Clean Architecture + SOLID
- Estrutura organizada por features
- Erros de domínio por contexto
- Testes unitários e integração (91 testes)
- Sistema de eventos (RabbitMQ)
- Documentação Swagger
- Docker + Docker Compose

### ⏳ Próximos Passos

- Autenticação/Autorização
- Rate Limiting
- Caching (Redis)
- Monitoring (APM)
- CI/CD Pipeline

---

**Esta arquitetura implementa Clean Architecture + SOLID para um sistema escalável, testável e maintível.**
