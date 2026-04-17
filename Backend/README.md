# ManuInd — Backend (Go + SQL Server)

## Pré-requisitos
- Go 1.21+
- SQL Server 2019+ (ou Azure SQL)

## Configuração

```bash
# 1. Copiar o .env
cp .env.example .env
# Editar .env com suas credenciais do SQL Server

# 2. Rodar as migrations no SQL Server
# Execute o arquivo scripts/migrations.sql no SQL Server Management Studio
# ou via sqlcmd:
sqlcmd -S localhost -U sa -P sua_senha -i scripts/migrations.sql

# 3. Instalar dependências
go mod tidy

# 4. Iniciar o servidor
go run ./cmd/main.go
```

## Endpoints disponíveis (Etapa 1)

| Método | Rota                  | Descrição              |
|--------|-----------------------|------------------------|
| POST   | /api/auth/login       | Login                  |
| GET    | /api/auth/me          | Perfil autenticado     |
| PUT    | /api/auth/password    | Alterar senha          |
| GET    | /api/users            | Listar usuários        |
| POST   | /api/users            | Criar usuário          |
| PUT    | /api/users/:id        | Atualizar usuário      |
| DELETE | /api/users/:id        | Desativar usuário      |
| GET    | /api/assets           | Árvore de ativos       |
| POST   | /api/assets           | Criar ativo            |
| PUT    | /api/assets/:id       | Atualizar ativo        |
| DELETE | /api/assets/:id       | Desativar ativo        |
| GET    | /api/accounts         | Árvore plano de contas |
| GET    | /api/accounts/flat    | Lista plana de contas  |
| POST   | /api/accounts         | Criar conta            |
| PUT    | /api/accounts/:id     | Atualizar conta        |
| DELETE | /api/accounts/:id     | Desativar conta        |
| GET    | /api/maintainers      | Listar manutentores    |
| POST   | /api/maintainers      | Criar manutentor       |
| PUT    | /api/maintainers/:id  | Atualizar manutentor   |
| DELETE | /api/maintainers/:id  | Desativar manutentor   |

## Credenciais padrão
- **E-mail:** admin@manuind.com
- **Senha:** Admin@123

## Estrutura
```
Backend/
├── cmd/main.go                         # Entry point
├── config/config.go                    # Configurações
├── database/database.go                # Conexão SQL Server
├── middleware/auth.go                  # JWT middleware
├── scripts/migrations.sql             # Schema do banco
└── internal/
    ├── domain/
    │   ├── models/                     # Structs de domínio
    │   └── repositories/interfaces.go # Contratos de repositório
    ├── repositories/                   # Implementações SQL
    ├── services/                       # Regras de negócio
    └── handlers/                       # HTTP handlers
```
