# Docker Setup - Mini Ledger

Este documento descreve como usar o Docker para executar a aplicação Mini Ledger com migrations automáticas.

## Arquitetura

O setup Docker inclui os seguintes serviços:

1. **postgres**: Banco de dados PostgreSQL com healthcheck
2. **rabbitmq**: Message broker para eventos com healthcheck e persistência
3. **migrations**: Executa as migrations do Prisma automaticamente
4. **app**: Aplicação principal que aguarda as migrations serem concluídas
5. **pgadmin**: Interface web para gerenciar o PostgreSQL (opcional)

## Fluxo de Inicialização

1. PostgreSQL inicia e aguarda estar pronto (healthcheck)
2. RabbitMQ inicia e aguarda estar pronto (healthcheck)
3. Serviço de migrations aguarda PostgreSQL estar saudável
4. Migrations são executadas automaticamente
5. Aplicação principal aguarda migrations serem concluídas E RabbitMQ estar saudável
6. Aplicação inicia e fica disponível na porta 3000

## Como usar

### Iniciar todos os serviços

```bash
docker compose up -d
```

### Iniciar apenas a infraestrutura (sem a aplicação)

```bash
docker compose up -d postgres rabbitmq pgadmin
```

### Iniciar com script de limpeza

```bash
# Usar o script de inicialização limpa
./scripts/start-clean.sh
```

### Executar apenas as migrations

```bash
docker compose run --rm migrations
```

### Ver logs da aplicação

```bash
docker compose logs -f app
```

### Ver logs das migrations

```bash
docker compose logs migrations
```

### Parar todos os serviços

```bash
docker compose down
```

### Limpar volumes (remove dados do banco)

```bash
docker compose down -v
```

## Variáveis de Ambiente

As seguintes variáveis de ambiente são configuradas automaticamente:

- `DATABASE_URL`: String de conexão com PostgreSQL
- `RABBITMQ_URL`: String de conexão com RabbitMQ
- `RABBITMQ_EXCHANGE`: Nome do exchange para eventos (events)
- `RABBITMQ_HEARTBEAT`: Heartbeat da conexão (60)
- `RABBITMQ_RECONNECT_ATTEMPTS`: Tentativas de reconexão (5)
- `RABBITMQ_RECONNECT_DELAY`: Delay entre tentativas (5000ms)
- `PORT`: Porta da aplicação (3000)
- `NODE_ENV`: Ambiente de execução (production)
- `EVENTS_ENABLE_RETRY`: Habilita retry automático (true)
- `EVENTS_RETRY_ATTEMPTS`: Número de tentativas de retry (3)
- `EVENTS_RETRY_DELAY`: Delay entre tentativas (5000ms)

## Portas Expostas

- **3000**: Aplicação principal
- **5432**: PostgreSQL
- **5672**: RabbitMQ AMQP
- **15672**: RabbitMQ Management UI
- **5050**: PgAdmin

## Credenciais Padrão

### PostgreSQL

- Usuário: `postgres`
- Senha: `postgres`
- Database: `mini_ledger`

### RabbitMQ

- Usuário: `admin`
- Senha: `admin`

### PgAdmin

- Email: `admin@admin.com`
- Senha: `admin`

## Troubleshooting

### Migrations falharam

```bash
# Ver logs das migrations
docker compose logs migrations

# Executar migrations manualmente
docker compose run --rm migrations
```

### Aplicação não inicia

```bash
# Verificar se todos os serviços estão rodando
docker compose ps

# Ver logs da aplicação
docker compose logs app

# Verificar healthcheck do PostgreSQL
docker compose exec postgres pg_isready -U postgres -d mini_ledger
```

### Rebuild da aplicação

```bash
# Rebuild apenas a aplicação
docker compose build app migrations

# Rebuild e reiniciar
docker compose up -d --build
```
