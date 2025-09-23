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
├── core/                    # 🎯 DOMÍNIO (regras de negócio)
│   ├── entities/            # Entidades de domínio
│   ├── usecases/            # Casos de uso por feature
│   ├── contracts/           # Interfaces/contratos
│   └── errors/              # Erros de domínio por contexto
├── adapters/                # 🔌 ADAPTADORES (conversores)
│   ├── controllers/         # Controllers por feature
│   └── repositories/        # Implementações de repositórios
├── infrastructure/          # 🏗️ INFRAESTRUTURA (detalhes técnicos)
│   ├── database/            # Cliente do banco
│   ├── http/                # Servidor web (Fastify)
│   ├── events/              # Sistema de eventos
│   ├── config/              # Configurações
│   └── container/           # Injeção de dependência
└── main/                    # 🚀 COMPOSIÇÃO (wiring)
    ├── routes/              # Registro de rotas
    └── server.ts            # Configuração final
```

### Testes

```
tests/
├── unit/                    # Testes unitários (isolados)
│   ├── core/               # Domínio (use cases, erros)
│   └── infrastructure/     # Infraestrutura (eventos, validação)
├── integration/             # Testes de integração (E2E)
│   └── adapters/controllers/ # Controllers por feature
├── mocks/                   # Mocks por camada
└── helpers/                 # Utilitários de teste
```

## 🎯 Regras Fundamentais

### 1. Fluxo de Dependências

```
Main → Infrastructure → Adapters → Core
```

- **Core**: Regras de negócio puras (independente)
- **Adapters**: Conversores entre core e mundo externo
- **Infrastructure**: Detalhes técnicos (DB, HTTP, Events)
- **Main**: Composição e wiring de dependências

### 2. Dependency Rule

- Dependências **sempre** apontam para dentro
- Core **nunca** conhece detalhes externos
- Use cases recebem dependências via **interfaces**

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
