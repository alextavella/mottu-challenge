#!/bin/bash
# Teste único para validar race conditions

BASE_URL="http://localhost:3000/v1"

echo "🧪 Teste de Race Condition - Sistema de Movimentação Financeira"

# 1. Verificar se a API está rodando
if ! curl -s "http://localhost:3000/health" > /dev/null; then
  echo "❌ API não está rodando. Inicie a API primeiro."
  exit 1
fi

# 2. Criar conta de teste (sempre nova)
TIMESTAMP=$(date +%s)
# Garantir que o documento tenha pelo menos 11 caracteres
DOCUMENT=$(printf "%011d" $TIMESTAMP)
echo "Criando conta de teste nova..."
ACCOUNT_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"name\": \"Test User $TIMESTAMP\", \"document\": \"$DOCUMENT\", \"email\": \"test$TIMESTAMP@example.com\"}" \
  $BASE_URL/accounts)

ACCOUNT_ID=$(echo $ACCOUNT_RESPONSE | jq -r '.accountId // .id')

if [ "$ACCOUNT_ID" = "null" ] || [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Falha ao criar conta de teste"
  echo "Resposta: $ACCOUNT_RESPONSE"
  exit 1
fi

echo "✅ Conta criada: $ACCOUNT_ID"

# 3. Verificar saldo inicial
INITIAL_BALANCE=$(curl -s "$BASE_URL/accounts/$ACCOUNT_ID/balance" | jq -r '.balance')
echo "Saldo inicial: $INITIAL_BALANCE"

# 4. Teste de Race Condition - Saques Simultâneos
echo ""
echo "🚨 Testando Race Condition - 12 saques simultâneos de R$ 100,00"
echo "Saldo disponível: $INITIAL_BALANCE"
echo "Valor total dos saques: R$ 1.000,00"
echo "Esperado: Saldo final = $INITIAL_BALANCE - 1000"

# Criar 50 saques simultâneos de 20 reais
echo "Criando 12 saques simultâneos de 100 reais usando hey..."
hey -n 12 -c 12 -m POST -H "Content-Type: application/json" \
  -d "{\"accountId\": \"$ACCOUNT_ID\", \"amount\": 100, \"type\": \"DEBIT\", \"description\": \"Saque simultâneo\"}" \
  $BASE_URL/movements

echo "✅ Todos os saques foram enviados"

# 5. Aguardar processamento
echo "Aguardando processamento de eventos (10 segundos)..."
sleep 30

# 6. Verificar resultados
FINAL_BALANCE=$(curl -s "$BASE_URL/accounts/$ACCOUNT_ID/balance" | jq -r '.balance')
COMPLETED=$(curl -s "$BASE_URL/movements?accountId=$ACCOUNT_ID&status=COMPLETED" | jq '.data | length')
PENDING=$(curl -s "$BASE_URL/movements?accountId=$ACCOUNT_ID&status=PENDING" | jq '.data | length')

echo ""
echo "📊 Resultados:"
echo "  Saldo final: $FINAL_BALANCE"
echo "  Saques processados: $COMPLETED"
echo "  Saques pendentes: $PENDING"

# 7. Calcular saldo esperado
EXPECTED_BALANCE=$(echo "$INITIAL_BALANCE - 1000" | bc)

# 8. Verificar se há race condition
echo ""
if [ "$FINAL_BALANCE" != "$EXPECTED_BALANCE" ]; then
  echo "⚠️  RACE CONDITION DETECTADA!"
  echo "   Saldo final ($FINAL_BALANCE) != Saldo esperado ($EXPECTED_BALANCE)"
  echo "   Diferença: $(echo "$FINAL_BALANCE - $EXPECTED_BALANCE" | bc)"
else
  echo "✅ Teste passou - Saldo consistente"
fi

# 9. Verificar se há movimentos pendentes
if [ "$PENDING" -gt 0 ]; then
  echo "⚠️  ATENÇÃO: $PENDING movimentos ainda estão pendentes"
  echo "   Isso pode indicar problemas no processamento de eventos"
fi

# 10. Verificar se o saldo não ficou negativo
if (( $(echo "$FINAL_BALANCE < 0" | bc -l) )); then
  echo "❌ PROBLEMA CRÍTICO: Saldo negativo detectado!"
fi

# 11. Limpeza automática
echo ""
echo "🧹 Limpando conta de teste..."
CLEANUP_RESPONSE=$(curl -s -X DELETE "$BASE_URL/accounts/$ACCOUNT_ID")
if echo "$CLEANUP_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
  echo "✅ Conta removida com sucesso"
else
  echo "⚠️  Falha ao remover conta (pode não existir endpoint de DELETE)"
fi

echo ""
echo "🎯 Teste concluído!"
echo "   Conta de teste: $ACCOUNT_ID (removida)"