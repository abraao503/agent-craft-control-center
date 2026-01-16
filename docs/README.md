# 📚 Documentação do Projeto

> **Agent Craft Control Center** - Plataforma SaaS B2B2C Multi-tenant

---

## 🎯 Início Rápido

Novo no projeto? Comece aqui:

1. **[Guia de Desenvolvimento](./DESENVOLVIMENTO.md)** ⭐ **PRINCIPAL**
   - Visão geral completa do projeto
   - Padrões de código e boas práticas
   - Stack tecnológica
   - Arquitetura e fluxos
   - Componentes reutilizáveis
   - Sistema de permissões

2. **[Sistema de Roles e Permissões](./api/SISTEMA_ROLES_PERMISSOES.md)**
   - 7 níveis de roles
   - Hierarquia e validações
   - Permissões detalhadas
   - Casos de uso

---

## 📖 Documentação por Área

### 🔐 Autenticação e Autorização

- **[Sistema de Roles e Permissões](./api/SISTEMA_ROLES_PERMISSOES.md)**
  - Modelo de negócio SaaS B2B2C
  - 7 roles com hierarquia
  - Permissões granulares
  - Validação de contexto
  - Implementação técnica

### 🔌 Comunicação em Tempo Real

- **[WebSocket](../WEBSOCKET.md)**
  - Configuração Socket.io
  - Eventos disponíveis
  - Como usar no frontend

---

## 🗂️ Estrutura da Documentação

```
docs/
├── README.md                              ← Você está aqui
├── DESENVOLVIMENTO.md                     ⭐ DOCUMENTO PRINCIPAL
└── api/
    └── SISTEMA_ROLES_PERMISSOES.md        (Roles e permissões)
```

---

## 🚀 Para Desenvolvedores

### Novo Desenvolvedor

1. Leia o **[Guia de Desenvolvimento](./DESENVOLVIMENTO.md)** completo
2. Entenda o **[Sistema de Roles](./api/SISTEMA_ROLES_PERMISSOES.md)**
3. Explore o código seguindo os padrões documentados
4. Faça perguntas! 😊

### Implementando Nova Feature

1. Consulte os padrões em **[DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)**
2. Siga a estrutura de pastas existente
3. Use componentes reutilizáveis quando possível
4. Documente mudanças significativas

### Trabalhando com Admin

1. Consulte os padrões em **[DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)**
2. Verifique as **[Permissões necessárias](./api/SISTEMA_ROLES_PERMISSOES.md)**
3. Use o componente **SmartPagination** para listas paginadas

---

## 📝 Documentação Consolidada

Toda informação de desenvolvimento, padrões e boas práticas foi consolidada em **DESENVOLVIMENTO.md** para facilitar a manutenção e evitar duplicação.

---

## 🔍 Encontrando Informação

### Procurando por...

**Padrões de código?**  
→ [DESENVOLVIMENTO.md - Padrões de Desenvolvimento](./DESENVOLVIMENTO.md#-padrões-de-desenvolvimento)

**Como usar React Query?**  
→ [DESENVOLVIMENTO.md - React Query Patterns](./DESENVOLVIMENTO.md#4-react-query-patterns)

**Sistema de permissões?**  
→ [SISTEMA_ROLES_PERMISSOES.md](./api/SISTEMA_ROLES_PERMISSOES.md)

**Componente de paginação?**  
→ [DESENVOLVIMENTO.md - SmartPagination](./DESENVOLVIMENTO.md#smartpagination)

**Estrutura de pastas?**  
→ [DESENVOLVIMENTO.md - Estrutura de Pastas](./DESENVOLVIMENTO.md#-estrutura-de-pastas)

**Criar nova feature?**  
→ [DESENVOLVIMENTO.md - Fluxo de Desenvolvimento](./DESENVOLVIMENTO.md#-fluxo-de-desenvolvimento)

**Roles e hierarquia?**  
→ [SISTEMA_ROLES_PERMISSOES.md - Hierarquia](./api/SISTEMA_ROLES_PERMISSOES.md#hierarquia-de-roles)

**Administração de empresas?**  
→ [DESENVOLVIMENTO.md - Sistema de Permissões](./DESENVOLVIMENTO.md#-sistema-de-permissões)

---

## 🤝 Contribuindo

Ao adicionar nova documentação:

1. ✅ Mantenha consistência com docs existentes
2. ✅ Use Markdown com formatação clara
3. ✅ Inclua exemplos de código quando relevante
4. ✅ Adicione referências cruzadas
5. ✅ Atualize este README.md se necessário

---

## 📊 Status das Documentações

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| **DESENVOLVIMENTO.md** | ✅ Principal | Nov 2024 |
| **README.md** | ✅ Índice | Nov 2024 |
| api/SISTEMA_ROLES_PERMISSOES.md | ✅ Ativo | Nov 2024 |

---

## 📞 Suporte

Dúvidas? Entre em contato com a equipe de desenvolvimento.

---

**Mantido por:** Equipe de Desenvolvimento  
**Última Atualização:** Novembro 2024
