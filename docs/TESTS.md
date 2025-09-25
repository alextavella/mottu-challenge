# 🧪 Testing Guide

Este projeto utiliza **Vitest** como framework de testes, fornecendo testes rápidos e confiáveis para garantir a qualidade do código.

## 📋 Estrutura de Testes

```
tests/
├── setup.ts                 # Configuração global dos testes
├── unit/                    # Testes unitários (isolados)
│   ├── core/               # Core (entities, errors, handlers, usecases)
│   │   ├── entities/       # Entidades de domínio
│   │   ├── errors/         # Erros de domínio
│   │   ├── events/         # Eventos de domínio
│   │   ├── handlers/       # Handlers de eventos
│   │   ├── repositories/   # Repositórios
│   │   └── usecases/       # Casos de uso
│   ├── domain/             # Testes de domínio
│   │   ├── entities/       # Entidades
│   │   └── errors/         # Erros por contexto
│   ├── http/               # Testes HTTP
│   │   └── middlewares/    # Middlewares
│   └── infrastructure/     # Testes de infraestrutura
│       └── events/         # Sistema de eventos
├── integration/             # Testes de integração (E2E)
│   ├── accounts/           # Testes de contas
│   ├── movements/          # Testes de movimentações
│   └── health/             # Testes de health check
├── helpers/                 # Utilitários de teste
│   ├── database-test-helper.ts
│   ├── event-test-helper.ts
│   ├── mock-helpers.ts
│   ├── server-test-helper.ts
│   └── validation-test-helper.ts
├── mocks/                   # Mocks para testes
│   ├── core/               # Mocks do core
│   └── infra/              # Mocks da infraestrutura
└── http/                    # Arquivos HTTP para testes
    ├── account.http
    ├── health.http
    └── movement.http
```

## 🚀 Comandos Disponíveis

### Executar Testes

```bash
# Executar todos os testes uma vez
pnpm test:run

# Executar testes em modo watch (reexecuta quando arquivos mudam)
pnpm test:watch

# Executar testes com interface visual
pnpm test:ui

# Executar testes com relatório de cobertura
pnpm test:coverage

# Executar testes (modo interativo padrão)
pnpm test
```

### Executar Testes Específicos

```bash
# Executar apenas testes unitários
pnpm test:run tests/unit/

# Executar apenas testes de integração
pnpm test:run tests/integration/

# Executar testes de um arquivo específico
pnpm test:run tests/unit/domain/errors.test.ts

# Executar testes que correspondem a um padrão
pnpm test:run --grep "BusinessError"

# Executar testes de uma feature específica
pnpm test:run tests/unit/core/usecases/accounts/
```

## 📊 Relatório de Cobertura

O relatório de cobertura é gerado automaticamente quando você executa `pnpm test:coverage`. Ele inclui:

- **% Statements**: Porcentagem de declarações executadas
- **% Branch**: Porcentagem de branches (condições) testadas
- **% Functions**: Porcentagem de funções testadas
- **% Lines**: Porcentagem de linhas executadas

O relatório é salvo em `coverage/` e pode ser visualizado no navegador abrindo `coverage/index.html`.

## 🏗️ Configuração

### Vitest Config

A configuração do Vitest está em `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true, // Permite usar describe, it, expect globalmente
    environment: 'node', // Ambiente Node.js
    setupFiles: ['./tests/setup.ts'], // Arquivo de setup global
    coverage: {
      provider: 'v8', // Provider de cobertura
      reporter: ['text', 'json', 'html'], // Formatos do relatório
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Alias para imports
    },
  },
});
```

### Setup Global

O arquivo `tests/setup.ts` contém configurações que são executadas antes de todos os testes:

- Configuração de variáveis de ambiente
- Setup de mocks globais
- Configuração de banco de dados de teste

## 📝 Escrevendo Testes

### Estrutura Básica

```typescript
import { describe, it, expect } from 'vitest';

describe('Minha Funcionalidade', () => {
  it('should do something correctly', () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Testes com Mocks

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Função com Dependencies', () => {
  it('should call dependency correctly', () => {
    // Arrange
    const mockDependency = vi.fn().mockReturnValue('mocked result');

    // Act
    const result = functionWithDependency(mockDependency);

    // Assert
    expect(mockDependency).toHaveBeenCalledWith(expectedParams);
    expect(result).toBe('expected result');
  });
});
```

### Testes Assíncronos

```typescript
describe('Função Assíncrona', () => {
  it('should handle async operations', async () => {
    // Arrange
    const asyncFunction = vi.fn().mockResolvedValue('async result');

    // Act
    const result = await myAsyncFunction(asyncFunction);

    // Assert
    expect(result).toBe('async result');
  });
});
```

## 🎯 Boas Práticas

### 1. Nomenclatura Clara

- Use nomes descritivos para testes
- Siga o padrão: "should [expected behavior] when [condition]"

```typescript
it('should throw BusinessError when account already exists', () => {
  // test implementation
});
```

### 2. Arrange-Act-Assert (AAA)

- **Arrange**: Configure o cenário do teste
- **Act**: Execute a função sendo testada
- **Assert**: Verifique o resultado

### 3. Testes Independentes

- Cada teste deve ser independente
- Use `beforeEach` para setup comum
- Use `afterEach` para cleanup

### 4. Mock Adequado

- Mock apenas dependências externas
- Use mocks para isolar a unidade sendo testada
- Verifique chamadas de mock quando necessário

### 5. Cobertura Significativa

- Vise alta cobertura, mas foque na qualidade
- Teste casos de sucesso e falha
- Inclua casos extremos (edge cases)

## 🐛 Debugging

### Executar Testes em Modo Debug

```bash
# Com Node.js debugger
node --inspect-brk node_modules/.bin/vitest run

# Com VS Code, adicione breakpoints e use F5
```

### Logs Durante Testes

```typescript
it('should debug test', () => {
  console.log('Debug info:', someVariable);
  // test implementation
});
```

## 📚 Recursos Adicionais

- [Documentação do Vitest](https://vitest.dev/)
- [Guia de Matchers](https://vitest.dev/api/expect.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Coverage Guide](https://vitest.dev/guide/coverage.html)

## ✅ Status Atual

- ✅ **Configuração do Vitest**: Completa
- ✅ **Testes de Erros de Domínio**: Implementados
- ✅ **Testes de Tipos de Eventos**: Implementados
- ✅ **Testes de Validação**: Implementados
- ✅ **Testes de Casos de Uso**: Implementados
- ✅ **Testes de Integração**: Implementados
- ✅ **Testes de Race Conditions**: Implementados
- ✅ **Relatório de Cobertura**: Configurado
- ✅ **Mocks e Helpers**: Implementados

### Métricas Atuais

- **Múltiplos arquivos** de teste organizados por camada
- **Cobertura configurada** (HTML + JSON + Text)
- **Testes unitários e de integração** completos
- **Testes de race condition** para validação de consistência
