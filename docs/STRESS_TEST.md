# 🧪 Teste de Race Condition

Teste simples e direto para validar race conditions no sistema de movimentação financeira.

## ⚠️ Vulnerabilidade Identificada

**Race Condition Crítica**: A validação de saldo insuficiente acontece antes da criação do movimento, mas a atualização do saldo acontece de forma assíncrona via eventos, criando uma janela de tempo onde múltiplas transações podem ser processadas incorretamente.

## 🛠️ Pré-requisitos

```bash
# hey - Load testing
go install github.com/rakyll/hey@latest

# jq - JSON processing
brew install jq
```

## 🚀 Execução do Teste

```bash
# Executar teste único
./scripts/test-race-condition.sh
```

## 🧪 O que o Teste Faz

1. **Cria uma conta de teste nova** com saldo inicial de R$ 1.000,00 (sempre única)
2. **Envia 12 saques simultâneos** de R$ 100,00 cada (total: R$ 1.200,00)
3. **Aguarda processamento** dos eventos (30 segundos)
4. **Verifica consistência** do saldo final
5. **Detecta race conditions** se o saldo não corresponder ao esperado
6. **Valida movimentos cancelados** devido a saldo insuficiente
7. **Remove a conta** automaticamente ao final

## 🔍 Sinais de Race Condition

- **Saldo inconsistente**: Saldo final diferente do esperado
- **Movimentos pendentes**: Movimentos que não foram processados
- **Saldo negativo**: Sistema permitiu saques além do saldo disponível
- **Processamento incompleto**: Nem todos os movimentos foram processados

## 📊 Resultado Esperado

- **Saldo inicial**: R$ 1.000,00
- **Valor dos saques**: R$ 1.200,00 (12 × R$ 100,00)
- **Saldo esperado**: R$ 0,00
- **Movimentos processados**: 10 (apenas os que cabem no saldo)
- **Movimentos pendentes**: 0
- **Movimentos cancelados**: 2 (devido a saldo insuficiente)

## ⚠️ Se o Teste Falhar

O teste pode falhar por:

1. **Race Condition**: Múltiplas validações de saldo baseadas no mesmo valor inicial
2. **Processamento Assíncrono**: Eventos processados fora de ordem
3. **Falha de Validação**: Sistema permitiu saques além do saldo disponível
4. **Problemas de Concorrência**: Transações simultâneas causando inconsistências

## 🔧 Limpeza

A conta de teste é **removida automaticamente** ao final do teste. Não é necessária limpeza manual.

## 📋 Checklist de Validação

- [x] **Saldo Consistente**: Saldo final = Saldo inicial - Valor dos saques
- [x] **Processamento Completo**: Todos os movimentos foram processados
- [x] **Validação Funcionando**: Nenhum saque excedeu o saldo disponível
- [x] **Sem Race Conditions**: Dados consistentes após processamento simultâneo
