#!/bin/bash

echo "🧹 Limpando RabbitMQ completamente..."

# Parar containers e remover volumes
echo "📦 Parando containers e removendo volumes..."
docker-compose down -v

# Remover todos os volumes relacionados ao projeto
echo "🗑️ Removendo todos os volumes do projeto..."
docker volume ls -q | grep mottu-challenge | xargs -r docker volume rm

# Remover containers órfãos
echo "🧽 Removendo containers órfãos..."
docker container prune -f

# Remover redes órfãs
echo "🌐 Removendo redes órfãs..."
docker network prune -f

echo "✅ Limpeza completa! Subindo containers..."
docker-compose up -d

# Aguardar RabbitMQ inicializar
echo "⏳ Aguardando RabbitMQ inicializar..."
sleep 10

echo "🎉 Pronto! RabbitMQ está completamente limpo e rodando."
