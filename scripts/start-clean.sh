#!/bin/bash

echo "🚀 Iniciando aplicação com limpeza completa..."

# Parar containers se estiverem rodando
echo "🛑 Parando containers existentes..."
docker-compose down -v

# Remover volumes específicos do projeto
echo "🗑️ Removendo volumes do projeto..."
docker volume ls -q | grep mottu-challenge | xargs -r docker volume rm

# Remover containers órfãos
echo "🧽 Removendo containers órfãos..."
docker container prune -f

# Remover redes órfãs
echo "🌐 Removendo redes órfãs..."
docker network prune -f

# Subir containers
echo "⬆️ Subindo containers..."
docker-compose up -d

# Aguardar RabbitMQ estar saudável
echo "⏳ Aguardando RabbitMQ estar pronto..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
  if docker exec mini-ledger-rabbitmq rabbitmq-diagnostics check_port_connectivity >/dev/null 2>&1; then
    echo "✅ RabbitMQ está pronto!"
    break
  fi
  echo "⏳ Aguardando RabbitMQ... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
  echo "❌ Timeout aguardando RabbitMQ"
  exit 1
fi

# Aguardar aplicação estar pronta
echo "⏳ Aguardando aplicação estar pronta..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
  if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Aplicação está rodando!"
    break
  fi
  echo "⏳ Aguardando aplicação... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
  echo "❌ Timeout aguardando aplicação"
  exit 1
fi

echo "🎉 Aplicação iniciada com sucesso!"
echo "📊 RabbitMQ Management: http://localhost:15672 (admin/admin)"
echo "🏥 Health Check: http://localhost:3000/health"
echo "📚 API Docs: http://localhost:3000/docs"
