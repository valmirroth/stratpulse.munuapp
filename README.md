# ManuInd — Sistema de Gestão de Manutenção Industrial

> Plataforma web completa para gestão de manutenção industrial: ativos, ordens de serviço, planos preventivos, lançamento de horas e aprovações.

---

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e Instalação](#configuração-e-instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Executando o Sistema](#executando-o-sistema)
- [Documentação da API (Swagger)](#documentação-da-api-swagger)
- [Credenciais Padrão](#credenciais-padrão)
- [Módulos do Sistema](#módulos-do-sistema)
- [Perfis de Acesso](#perfis-de-acesso)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Fluxos Principais](#fluxos-principais)

---

## Visão Geral

O **ManuInd** é um sistema web de gestão de manutenção industrial que cobre o ciclo completo:

- Cadastro hierárquico de **ativos** em árvore (planta → área → sistema → subsistema → equipamento → componente, até 15 níveis)
- **Plano de contas gerencial** em árvore para classificação de custos
- Cadastro de **manutentores** com especialidade e taxa horária
- **Planos de manutenção preventiva** com checklists de tarefas
- **Ordens de Serviço** com máquina de estados e atribuição de manutentores
- **Lançamento e aprovação de horas** por OS
- **Dashboard** com KPIs em tempo real: backlog, horas aprovadas, top manutentores, tendências mensais
- Gestão de **usuários** com perfis de acesso

---

## Tecnologias

| Camada        | Tecnologia                                                       |
|---------------|------------------------------------------------------------------|
| Backend       | Go 1.21, [chi](https://github.com/go-chi/chi) router            |
| Banco         | Microsoft SQL Server 2019+                                       |
| Autenticação  | JWT (golang-jwt/jwt/v5), bcrypt                                  |
| Frontend      | React 18, TypeScript, Vite, Tailwind CSS                         |
| UI Libs       | lucide-react, react-hook-form, react-hot-toast, axios            |
| API Docs      | OpenAPI 3.0 (Swagger UI embutido em `/docs`)                     |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                   │
│  React 18 + TypeScript + Tailwind CSS                │
│  http://localhost:5173                               │
│  Proxy /api  →  http://localhost:8080                │
└───────────────────────┬─────────────────────────────┘
                        │ REST / JSON
┌───────────────────────▼─────────────────────────────┐
│                   Backend (Go)                       │
│  chi router · JWT middleware · CORS                  │
│  http://localhost:8080                               │
│                                                      │
│  Handler → Service → Repository → SQL Server         │
└───────────────────────┬─────────────────────────────┘
                        │ go-mssqldb
┌───────────────────────▼─────────────────────────────┐
│               SQL Server                             │
│  Banco: manuind  |  9 tabelas + seed data            │
└─────────────────────────────────────────────────────┘
```

### Camadas do Backend

| Camada         | Responsabilidade                                              |
|----------------|---------------------------------------------------------------|
| **Handler**    | Decodifica request HTTP, chama service, serializa response    |
| **Service**    | Regras de negócio (máquina de estados, validações, cálculos)  |
| **Repository** | SQL puro com `database/sql` e parâmetros nomeados             |
| **Domain**     | Structs de modelo e interfaces dos repositórios               |

---

## Pré-requisitos

- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/) e npm
- [SQL Server 2019+](https://www.microsoft.com/pt-br/sql-server/sql-server-downloads)
- Git

### SQL Server via Docker (opcional)

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=ManuInd@2025" \
  -p 1433:1433 --name manuind-sql \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

---

## Configuração e Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/valmirroth/stratpulse.munuapp.git
cd stratpulse.munuapp
```

### 2. Banco de dados

Execute o script de migração no SQL Server:

```bash
# Via sqlcmd
sqlcmd -S localhost -U sa -P "SuaSenha" -i Backend/scripts/migrations.sql

# Ou abra o arquivo Backend/scripts/migrations.sql no SSMS e execute
```

O script cria o banco `manuind`, as 9 tabelas, o usuário admin padrão e 13 contas gerenciais iniciais.

### 3. Backend

```bash
cd Backend

# Copie e edite o arquivo de ambiente
cp .env.example .env
# Edite .env com suas credenciais (veja a seção abaixo)

# Baixe as dependências
go mod download

# Execute
go run ./cmd/main.go
```

### 4. Frontend

```bash
cd Frontend
npm install
npm run dev
```

---

## Variáveis de Ambiente

Arquivo `Backend/.env`:

```env
# Servidor
PORT=8080

# SQL Server
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=manuind
DB_USER=sa
DB_PASS=SuaSenha@2025

# JWT (use uma string longa e aleatória em produção)
JWT_SECRET=manuind-secret-key-change-in-production
```

| Variável      | Descrição                        | Padrão     |
|---------------|----------------------------------|------------|
| `PORT`        | Porta do servidor HTTP           | `8080`     |
| `DB_SERVER`   | Hostname do SQL Server           | `localhost` |
| `DB_PORT`     | Porta do SQL Server              | `1433`     |
| `DB_NAME`     | Nome do banco de dados           | `manuind`  |
| `DB_USER`     | Usuário do banco                 | —          |
| `DB_PASS`     | Senha do banco                   | —          |
| `JWT_SECRET`  | Chave secreta para assinar JWTs  | —          |

---

## Executando o Sistema

```bash
# Terminal 1 — Backend  (http://localhost:8080)
cd Backend && go run ./cmd/main.go

# Terminal 2 — Frontend (http://localhost:5173)
cd Frontend && npm run dev
```

### Build de produção

```bash
# Backend
cd Backend && go build -o manuind ./cmd/main.go && ./manuind

# Frontend
cd Frontend && npm run build   # gera dist/
```

---

## Documentação da API (Swagger)

Com o backend rodando, acesse a documentação interativa:

**→ [http://localhost:8080/docs](http://localhost:8080/docs)**

A spec OpenAPI 3.0 (YAML) está disponível em:

**→ [http://localhost:8080/docs/swagger.yaml](http://localhost:8080/docs/swagger.yaml)**

### Como autenticar no Swagger UI

1. Abra `http://localhost:8080/docs`
2. Execute `POST /api/auth/login` com as credenciais padrão
3. Copie o `token` da resposta
4. Clique em **Authorize** (ícone 🔒) no topo da página
5. Cole o token no campo `Value` e clique **Authorize**
6. Todas as requisições seguintes incluirão o header `Authorization: Bearer <token>`

---

## Credenciais Padrão

| Campo   | Valor                |
|---------|----------------------|
| E-mail  | `admin@manuind.com`  |
| Senha   | `Admin@123`          |
| Perfil  | Administrador        |

> ⚠️ Altere a senha do administrador imediatamente após o primeiro acesso em produção.

---

## Módulos do Sistema

### 🏭 Ativos
Cadastro hierárquico de objetos de manutenção em árvore com até 15 níveis.

| Tipo          | Descrição                      |
|---------------|-------------------------------|
| `plant`       | Planta industrial              |
| `area`        | Área / setor                  |
| `system`      | Sistema                       |
| `subsystem`   | Subsistema                    |
| `equipment`   | Equipamento                   |
| `component`   | Componente                    |

### 📊 Plano de Contas Gerencial
Árvore de contas para classificação de custos de manutenção.

| Campo     | Valores                            |
|-----------|------------------------------------|
| Tipo      | `synthetic` (agrupadora) / `analytical` (recebe lançamentos) |
| Natureza  | `debit` / `credit`                 |

### 👷 Manutentores
Profissionais de manutenção com especialidade, taxa horária e vínculo opcional com usuário do sistema.

### 📋 Planos de Manutenção
Planos preventivos com frequência configurável e checklist de tarefas.

| Frequência  | Descrição     |
|-------------|---------------|
| `daily`     | Diário        |
| `weekly`    | Semanal       |
| `monthly`   | Mensal        |
| `hours`     | Por horas de operação |

### 🔧 Ordens de Serviço
OS com máquina de estados, atribuição de manutentores e cálculo de custos.

| Tipo           | Descrição       |
|----------------|-----------------|
| `preventive`   | Preventiva      |
| `corrective`   | Corretiva       |
| `predictive`   | Preditiva       |

**Fluxo de status:**
```
open  ──►  in_progress  ──►  completed
                        ──►  cancelled
```

| Status        | Descrição                        |
|---------------|----------------------------------|
| `open`        | Aberta, aguardando início        |
| `in_progress` | Em andamento                     |
| `completed`   | Concluída                        |
| `cancelled`   | Cancelada                        |

### ⏱️ Lançamento de Horas
Registro de horas trabalhadas por OS com workflow de aprovação.

```
pending  ──►  approved
         ──►  rejected
```

> A aprovação de um lançamento move automaticamente a OS para `in_progress`.

### 📈 Dashboard
KPIs em tempo real: contagem por status, horas aprovadas vs. pendentes, top 5 manutentores, gráfico mensal (últimos 6 meses), 8 OSs mais recentes.

### 👥 Usuários
Gestão de acessos com controle de perfis de acesso.

---

## Perfis de Acesso

| Perfil           | Código        | Permissões principais                                   |
|------------------|---------------|---------------------------------------------------------|
| Administrador    | `admin`       | Acesso total: gerencia usuários, aprova horas, CRUD completo |
| Gerente          | `manager`     | Aprova/rejeita horas, visualiza tudo, cria e edita registros |
| Manutentor       | `maintainer`  | Lança horas, visualiza suas OSs e planos atribuídos    |

---

## Estrutura de Pastas

```
stratpulse.munuapp/
├── README.md
├── Backend/
│   ├── .env.example
│   ├── go.mod
│   ├── cmd/
│   │   ├── main.go                  # Entry point + wiring de dependências
│   │   └── docs/
│   │       ├── swagger.yaml         # Spec OpenAPI 3.0 (todos os endpoints)
│   │       └── index.html           # Swagger UI (servido em /docs)
│   ├── config/
│   │   └── config.go                # Carregamento de variáveis de ambiente
│   ├── database/
│   │   └── database.go              # Connection pool SQL Server
│   ├── middleware/
│   │   └── auth.go                  # Validação JWT + helpers GetUserID/GetUserRole
│   ├── internal/
│   │   ├── domain/
│   │   │   ├── models/              # 7 arquivos de structs de domínio
│   │   │   └── repositories/        # Interfaces de repositório + filtros
│   │   ├── repositories/            # 7 implementações SQL
│   │   ├── services/                # 8 serviços com regras de negócio
│   │   └── handlers/                # 9 handlers HTTP + helpers
│   └── scripts/
│       └── migrations.sql           # Schema completo + dados iniciais
└── Frontend/
    ├── package.json
    ├── vite.config.ts               # Proxy /api → :8080
    ├── tailwind.config.js
    └── src/
        ├── App.tsx                  # Definição de rotas
        ├── index.css                # Tailwind + classes utilitárias (.btn, .card, .badge…)
        ├── types/index.ts           # Todos os tipos TypeScript do sistema
        ├── contexts/AuthContext.tsx # Estado global de autenticação (JWT + localStorage)
        ├── services/                # 8 arquivos de chamadas à API (axios)
        ├── components/common/       # Sidebar, Header, Layout, TreeNode (genérico)
        └── pages/                   # 8 páginas: Dashboard, Assets, Accounts,
                                     # Maintainers, MaintenancePlans, WorkOrders,
                                     # TimeEntries, Users
```

---

## Fluxos Principais

### OS Corretiva (equipamento quebrado)

```
1. Operador identifica problema no equipamento
2. Gerente/Admin cria OS (tipo: corrective) vinculada ao ativo
3. Atribui manutentor responsável à OS
4. Manutentor executa o reparo e lança horas (status: pending)
5. Gerente aprova as horas → OS muda automaticamente para in_progress
6. Gerente/Admin conclui a OS (status: completed)
7. Dashboard atualiza KPIs em tempo real
```

### OS Preventiva (agendada)

```
1. Cria Plano de Manutenção com frequência e checklist de tarefas
2. Gera OS (tipo: preventive) vinculada ao plano e ao ativo
3. Agenda data de execução
4. Manutentor executa o checklist de tarefas da OS
5. Lança horas trabalhadas
6. Aprovação e conclusão da OS
```

### Ciclo de aprovação de horas

```
Manutentor                  Gerente/Admin
─────────                   ─────────────
Lança horas (pending)  ──►  Visualiza fila de pendentes
                            Aprova → OS vai para in_progress
                            Rejeita → Manutentor corrige e relança
```

---

## Contribuição

1. Crie uma branch a partir de `main`
2. Faça suas alterações com commits descritivos
3. Abra um Pull Request descrevendo o que foi alterado e por quê

---

*ManuInd v1.0.0 — Desenvolvido com Go + React*
