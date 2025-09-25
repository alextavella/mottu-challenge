# 🧪 Testes de Race Condition

Scripts para validar race conditions no sistema de movimentação financeira.

## 🚀 Uso

```bash
# Teste assíncrono (endpoint padrão)
./scripts/test-race-condition.sh

# Teste síncrono (novo endpoint)
./scripts/test-race-condition-sync.sh

# Comparação entre endpoints
./scripts/compare-endpoints.sh
```

## ⚠️ Pré-requisitos

- API rodando em `http://localhost:3000`
- `hey` instalado: `go install github.com/rakyll/hey@latest`
- `jq` instalado: `brew install jq`

## 🧪 O que os Testes Fazem

### Teste Assíncrono (`test-race-condition.sh`)

1. Cria conta de teste com saldo de R$ 1.000,00
2. Envia 50 saques simultâneos via `POST /movements`
3. Usa processamento assíncrono via RabbitMQ
4. Verifica consistência após processamento

### Teste Síncrono (`test-race-condition-sync.sh`)

1. Cria conta de teste com saldo de R$ 1.000,00
2. Envia 50 saques simultâneos via `POST /movements/sync`
3. Usa processamento síncrono (sem RabbitMQ)
4. Verifica consistência imediata

### Comparação (`compare-endpoints.sh`)

1. Testa ambos os endpoints
2. Compara performance e consistência
3. Mostra diferenças entre os modos

## 📊 Resultados Esperados

- **Saldo inicial**: R$ 1.000,00
- **Saldo final**: R$ 0,00
- **Movimentos processados**: 50
- **Movimentos pendentes**: 0

## ⚠️ Se Falhar

Os testes podem detectar:

- Race conditions na validação de saldo
- Problemas de processamento assíncrono
- Inconsistências de dados
- Falhas de validação de saldo insuficiente
- Diferenças de performance entre endpoints

## 🔧 Status dos Endpoints

- ✅ **Assíncrono** (`/movements`): Funcionando
- ⚠️ **Síncrono** (`/movements/sync`): Em desenvolvimento
- ✅ **Comparação**: Scripts prontos

## 📝 Notas

- Os testes usam `hey` para carga simultânea
- Cada teste cria uma conta única
- Limpeza automática após execução
- Logs detalhados de performance
