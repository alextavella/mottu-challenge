# Event Manager System

Sistema de gerenciamento de eventos usando RabbitMQ para arquitetura orientada a eventos.

## 🚀 Características

- **Conexão automática com reconexão**: Gerencia automaticamente a conexão com RabbitMQ
- **Publisher/Consumer abstraído**: Interface simples para publicar e consumir eventos
- **Retry automático**: Sistema de retry com backoff exponencial
- **Dead Letter Queue**: Mensagens que falharam são enviadas para DLQ
- **Type Safety**: Totalmente tipado com TypeScript
- **Graceful Shutdown**: Fechamento limpo das conexões
- **Configuração via Environment**: Fácil configuração através de variáveis de ambiente

## 📋 Configuração

### Variáveis de Ambiente

```env
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

## 🔧 Uso Básico

### 1. Publicando Eventos

```typescript
import { EventFactory, getEventManager } from '@/lib/events';
import { MovementEventType } from '@/lib/events/types/movement-event';

// Obter instância do gerenciador
const eventManager = getEventManager();

// Criar evento de movimento
const movementEvent = EventFactory.createMovementEvent(
  MovementEventType.CREATED,
  {
    id: 'mov_123',
    accountId: 'acc_456',
    amount: 100.5,
    type: 'credit',
    description: 'Depósito de salário',
    balance: 1500.75,
  },
  'correlation_123', // ID de correlação opcional
);

// Publicar evento
await eventManager.publish(movementEvent);
```

### 2. Consumindo Eventos

```typescript
import { EventHandlers, getEventManager } from '@/lib/events';
import { MovementEventType } from '@/lib/events/types/movement-event';

// Obter instância do gerenciador
const eventManager = getEventManager();

// Usar handler pré-definido
const ledgerHandler = new EventHandlers.LedgerLogHandler();

// Registrar consumer
await eventManager.subscribe(MovementEventType.CREATED, ledgerHandler, {
  queue: 'ledger.movement.created',
  prefetch: 5,
  retryAttempts: 3,
  retryDelay: 2000,
});

// Iniciar consumo
await eventManager.startConsumer();
```

### 3. Configuração de Consumers

```typescript
// src/events/consumers.ts
import { EventHandlers, getEventManager } from '@/lib/events';
import { MovementEventType } from '@/lib/events/types/movement-event';

export async function setupEventConsumers() {
  const eventManager = getEventManager();

  const ledgerHandler = new EventHandlers.LedgerLogHandler();

  // Assinar todos os eventos de movimento
  await eventManager.subscribe(MovementEventType.ALL, ledgerHandler, {
    queue: 'ledger.all.movements',
    routingKey: 'movement.*',
  });

  await eventManager.startConsumer();
}
```

## 📚 Tipos de Eventos

### Movement Events

```typescript
enum MovementEventType {
  ALL = 'movement.*',
  CREATED = 'movement.created',
  UPDATED = 'movement.updated',
  DELETED = 'movement.deleted',
}
```

### Account Events

```typescript
enum AccountEventType {
  ALL = 'account.*',
  CREATED = 'account.created',
  UPDATED = 'account.updated',
  BALANCE_UPDATED = 'account.balance_updated',
}
```

## 🏗️ Arquitetura

```
EventManager
├── RabbitMQConnection (gerencia conexão)
├── RabbitMQEventPublisher (publica eventos)
└── RabbitMQEventConsumer (consome eventos)
```

### Componentes Principais

- **EventManager**: Classe principal que orquestra publisher e consumer
- **EventFactory**: Factory para criar eventos tipados
- **EventHandlers**: Handlers pré-definidos (ex: LedgerLogHandler)
- **getEventManager()**: Factory function que retorna instância singleton

## 🔄 Handler Personalizado

```typescript
import { EventHandler } from '@/lib/events/types/base-event';
import { MovementEvent } from '@/lib/events/types/movement-event';

export class CustomMovementHandler implements EventHandler<MovementEvent> {
  async handle(event: MovementEvent): Promise<void> {
    console.log(`Processando movimento: ${event.data.id}`);

    // Sua lógica personalizada aqui
    // Ex: notificações, auditoria, etc.
  }
}
```

## 🚦 Exemplo: Ledger Handler

O sistema inclui um handler pré-definido para logging no ledger:

```typescript
// Implementação do LedgerLogHandler
export class LedgerLogHandler implements EventHandler<MovementEvent> {
  async handle(event: MovementEvent): Promise<void> {
    await prisma.ledgerLog.create({
      data: {
        id: event.id,
        type: event.type,
        movementId: event.data.id,
        accountId: event.data.accountId,
        amount: event.data.amount,
        data: JSON.stringify(event.data),
      },
    });
  }
}
```

## ⚠️ Considerações Importantes

1. **Transações**: Sempre publique eventos APÓS o sucesso da transação do banco
2. **Idempotência**: Handlers devem ser idempotentes para lidar com reprocessamento
3. **Singleton**: Use `getEventManager()` para obter a instância global
4. **Graceful Shutdown**: Use `shutdownEventManager()` no encerramento da aplicação

## 🔧 API Principal

### EventManager

```typescript
// Publicar evento único
await eventManager.publish(event);

// Publicar múltiplos eventos
await eventManager.publishBatch([event1, event2]);

// Assinar eventos
await eventManager.subscribe(eventType, handler, options);

// Iniciar consumer
await eventManager.startConsumer();

// Parar consumer
await eventManager.stopConsumer();

// Encerrar completamente
await eventManager.shutdown();
```

### Factory Functions

```typescript
// Obter instância global
const eventManager = getEventManager();

// Encerrar instância global
await shutdownEventManager();
```

### Event Factory

```typescript
// Criar evento de movimento
const event = EventFactory.createMovementEvent(type, data, correlationId);

// Criar evento de conta
const event = EventFactory.createAccountEvent(type, data, correlationId);
```

## 🔧 Troubleshooting

### Problemas de Conexão

- Verifique se RabbitMQ está rodando
- Confirme a URL de conexão nas variáveis de ambiente
- Verifique logs de reconexão

### Mensagens na DLQ

- Analise logs de erro dos handlers
- Verifique se handlers são idempotentes
- Considere aumentar retry attempts se necessário

### Performance

- Ajuste `prefetch` baseado na capacidade de processamento
- Monitore uso de memória e CPU
- Configure heartbeat adequadamente
