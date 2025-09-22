# 📘 Mini Ledger – Desafio Técnico
## 🎯 Objetivo
Um **ledger** (ou *livro razão*) é o sistema central de registro de todas as movimentações financeiras de uma instituição.  
Ele garante que **créditos e débitos** sejam armazenados de forma **imparcial, consistente e auditável**, servindo como a fonte da verdade para cálculo de saldos, limites de crédito e análise de risco.  
Nas fintechs e empresas de crédito, o ledger é peça fundamental para:
- controlar o uso de limites de crédito;  
- garantir integridade em movimentações financeiras;  
- fornecer base sólida para prevenção a fraudes e inadimplência;  
- permitir auditoria e rastreabilidade de transações.  
Neste desafio, você irá implementar um **mini ledger**, que é uma versão reduzida desse sistema.  
O objetivo é avaliar sua capacidade de:  
- modelar contas e movimentações financeiras;  
- garantir consistência transacional;  
- integrar com um sistema de mensageria para processamento assíncrono.

## 📥 Submissão
👉 **Preencha o formulário de entrega aqui:**  
[✨ Acessar Formulário de Submissão ✨](https://forms.office.com/r/2rcaxQQxCJ)

---
## 📐 Funcionalidades Requeridas
### 1. Accounts
- **POST /accounts**
  - Cria uma nova conta com dados básicos (`name`, `document`, `email`).  
  - Todo usuário nasce com limite de crédito inicial de **1000 BRL**.  
  - Retornar `accountId`.  
- **GET /accounts/:id/balance**
  - Retorna o saldo atual e o limite de crédito disponível.  
---
### 2. Movements
- **POST /movements**
  - Cria um movimento de **crédito** ou **débito**.
     - "CREDIT" | "DEBIT" 
  - Request:
    ```json
    {
      "accountId": "uuid",
      "amount": 200,
      "type": "CREDIT",
      "description": "Compra no mercado"
    }
    ```
  - Regras:
    - `CREDIT` → aumenta o saldo.  
    - `DEBIT` → reduz o saldo.  
    - Débito não pode ultrapassar o saldo + limite → deve ser rejeitado.  
---
### 3. Ledger Consistency
- Cada movimento deve ser **persistido de forma transacional** no banco.  
- Após persistido, o movimento deve ser **enviado para a fila/pubsub** (RabbitMQ ou GCP Pub/Sub).  
- Criar um **consumer** que consome as mensagens e grava em uma tabela de log (`ledger_log`).  
---
## 🚧 Requisitos Técnicos
- **Node.js + NestJS**.  
- **PostgreSQL** (pode usar TypeORM, Prisma ou Knex).  
- **Mensageria**: RabbitMQ **ou** GCP Pub/Sub.  
  - Deve ser implementado com **clients nativos** (`amqplib`, `@google-cloud/pubsub`).  
  - **Não usar `@nestjs/microservices`**.  
- Projeto deve rodar com `docker-compose`.  
---
## ⚡ Diferenciais
- Testes unitários e/ou de integração.  
- Migrations de banco.  
- Documentação da API (Swagger ou README com exemplos de curl).  
- Retry e tratamento de erros no consumer.  
---
## 📦 Entregáveis
- O código deve estar em um repositório privado no GitHub.
- O repositório deve conter:
  - Código fonte da aplicação.
  - docker-compose.yml para rodar dependências.
  - README com instruções de setup.
| **Atenção**: conceder acesso ao usuário @yan-almeida, @Goufix, @galacerda, @rafaelcastan e @brunosmm.
