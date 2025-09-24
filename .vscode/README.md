# Configuração do Debugger para Testes

## Como usar o debugger do Vitest no VS Code

### Configurações disponíveis:

1. **🧪 Vitest: Debug All** - Executa todos os testes com debug habilitado
2. **🧪 Vitest: Watch** - Executa testes em modo watch com debug habilitado
3. **🧪 Vitest: Debug Current File** - Executa apenas o arquivo de teste atual com debug

### Como usar:

1. **Para debugar um arquivo específico:**
   - Abra o arquivo de teste que deseja debugar
   - Coloque breakpoints nas linhas desejadas
   - Execute "🧪 Vitest: Debug Current File" no painel de Debug

2. **Para debugar todos os testes:**
   - Coloque breakpoints nos arquivos de teste ou código fonte
   - Execute "🧪 Vitest: Debug All" no painel de Debug

3. **Para modo watch com debug:**
   - Execute "🧪 Vitest: Watch" no painel de Debug
   - Os testes serão executados automaticamente quando arquivos forem modificados

### Dicas importantes:

- Certifique-se de que os breakpoints estão nos arquivos `.ts` em `src/` ou `tests/`
- O debugger funciona melhor com `--threads=false` (já configurado)
- Source maps estão habilitados para mapeamento correto dos breakpoints
- Use `autoAttachChildProcesses: true` para debugar processos filhos do Vitest

### Troubleshooting:

- Se os breakpoints não funcionarem, tente executar "🧪 Vitest: Debug All" primeiro
- Verifique se o arquivo está salvo antes de colocar breakpoints
- Certifique-se de que está usando a versão correta do Node.js (>=22.0.0)
