# ManuInd — Frontend (React + TypeScript + Tailwind)

## Pré-requisitos
- Node.js 18+
- npm ou yarn

## Configuração

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em desenvolvimento
npm run dev
# Acesse: http://localhost:5173

# 3. Build para produção
npm run build
```

## Estrutura

```
Frontend/
├── src/
│   ├── types/index.ts          # Todos os tipos TypeScript
│   ├── services/               # Camada de API (axios)
│   │   ├── api.ts              # Instância axios configurada
│   │   ├── auth.service.ts
│   │   ├── asset.service.ts
│   │   ├── account.service.ts
│   │   └── maintainer.service.ts
│   ├── contexts/
│   │   └── AuthContext.tsx     # Autenticação global
│   ├── components/
│   │   └── common/             # Layout, Sidebar, Header, TreeNode
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── Assets.tsx          # Cadastro de ativos em árvore
│       ├── Accounts.tsx        # Plano de contas gerencial
│       └── Maintainers.tsx     # Cadastro de manutentores
```

## Páginas (Etapa 1)
- **Login** — Autenticação JWT
- **Dashboard** — Visão geral
- **Ativos** — Árvore hierárquica (até 15 níveis)
- **Plano de Contas** — Estrutura contábil em árvore
- **Manutentores** — Cadastro da equipe

## Etapas futuras
- **Etapa 2:** Planos de manutenção preventiva + Ordens de serviço
- **Etapa 3:** Lançamento de horas + Dashboard com KPIs reais
