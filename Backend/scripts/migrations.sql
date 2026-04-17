-- ============================================================
-- ManuInd - Script de Migração do Banco de Dados SQL Server
-- Versão: 1.0  |  Sistema de Manutenção Industrial
-- ============================================================

USE master;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'manuind')
    CREATE DATABASE manuind;
GO
USE manuind;
GO

-- ============================================================
-- TABELA: users
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        name          NVARCHAR(100)  NOT NULL,
        email         NVARCHAR(100)  NOT NULL UNIQUE,
        password_hash NVARCHAR(255)  NOT NULL,
        role          NVARCHAR(20)   NOT NULL DEFAULT 'maintainer',
        active        BIT            NOT NULL DEFAULT 1,
        created_at    DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at    DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela users criada.';
END
GO

-- ============================================================
-- TABELA: assets  (objetos em árvore - até 15 níveis)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='assets' AND xtype='U')
BEGIN
    CREATE TABLE assets (
        id          BIGINT IDENTITY(1,1) PRIMARY KEY,
        parent_id   BIGINT         NULL REFERENCES assets(id),
        code        NVARCHAR(50)   NOT NULL UNIQUE,
        name        NVARCHAR(200)  NOT NULL,
        description NVARCHAR(500),
        type        NVARCHAR(50)   NOT NULL,
        level       INT            NOT NULL DEFAULT 1,
        active      BIT            NOT NULL DEFAULT 1,
        created_at  DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at  DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela assets criada.';
END
GO

-- ============================================================
-- TABELA: account_plan  (plano de contas gerencial)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='account_plan' AND xtype='U')
BEGIN
    CREATE TABLE account_plan (
        id         BIGINT IDENTITY(1,1) PRIMARY KEY,
        parent_id  BIGINT         NULL REFERENCES account_plan(id),
        code       NVARCHAR(50)   NOT NULL UNIQUE,
        name       NVARCHAR(200)  NOT NULL,
        type       NVARCHAR(20)   NOT NULL DEFAULT 'analytical',
        nature     NVARCHAR(20)   NOT NULL DEFAULT 'debit',
        level      INT            NOT NULL DEFAULT 1,
        active     BIT            NOT NULL DEFAULT 1,
        created_at DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela account_plan criada.';
END
GO

-- ============================================================
-- TABELA: maintainers
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='maintainers' AND xtype='U')
BEGIN
    CREATE TABLE maintainers (
        id           BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id      BIGINT         NULL REFERENCES users(id),
        name         NVARCHAR(100)  NOT NULL,
        registration NVARCHAR(50)   NOT NULL UNIQUE,
        specialty    NVARCHAR(100)  NOT NULL,
        phone        NVARCHAR(20),
        email        NVARCHAR(100),
        hourly_rate  DECIMAL(10,2)  NOT NULL DEFAULT 0,
        active       BIT            NOT NULL DEFAULT 1,
        created_at   DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at   DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela maintainers criada.';
END
GO

-- ============================================================
-- TABELA: maintenance_plans
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='maintenance_plans' AND xtype='U')
BEGIN
    CREATE TABLE maintenance_plans (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        asset_id        BIGINT         NOT NULL REFERENCES assets(id),
        account_id      BIGINT         NULL REFERENCES account_plan(id),
        code            NVARCHAR(50)   NOT NULL UNIQUE,
        name            NVARCHAR(200)  NOT NULL,
        description     NVARCHAR(1000),
        frequency_type  NVARCHAR(20)   NOT NULL,
        frequency_value INT            NOT NULL DEFAULT 1,
        estimated_hours DECIMAL(10,2)  NOT NULL DEFAULT 0,
        priority        NVARCHAR(20)   NOT NULL DEFAULT 'medium',
        active          BIT            NOT NULL DEFAULT 1,
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela maintenance_plans criada.';
END
GO

-- ============================================================
-- TABELA: maintenance_plan_tasks
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='maintenance_plan_tasks' AND xtype='U')
BEGIN
    CREATE TABLE maintenance_plan_tasks (
        id                BIGINT IDENTITY(1,1) PRIMARY KEY,
        plan_id           BIGINT         NOT NULL REFERENCES maintenance_plans(id) ON DELETE CASCADE,
        sequence          INT            NOT NULL,
        description       NVARCHAR(500)  NOT NULL,
        estimated_minutes INT            NOT NULL DEFAULT 0
    );
    PRINT 'Tabela maintenance_plan_tasks criada.';
END
GO

-- ============================================================
-- TABELA: work_orders
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='work_orders' AND xtype='U')
BEGIN
    CREATE TABLE work_orders (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        code            NVARCHAR(50)   NOT NULL UNIQUE,
        asset_id        BIGINT         NOT NULL REFERENCES assets(id),
        plan_id         BIGINT         NULL REFERENCES maintenance_plans(id),
        account_id      BIGINT         NULL REFERENCES account_plan(id),
        type            NVARCHAR(20)   NOT NULL,
        priority        NVARCHAR(20)   NOT NULL DEFAULT 'medium',
        status          NVARCHAR(20)   NOT NULL DEFAULT 'open',
        requested_date  DATETIME2      NOT NULL DEFAULT GETDATE(),
        scheduled_date  DATETIME2      NULL,
        started_date    DATETIME2      NULL,
        completed_date  DATETIME2      NULL,
        description     NVARCHAR(1000) NOT NULL,
        observations    NVARCHAR(1000),
        estimated_hours DECIMAL(10,2)  NOT NULL DEFAULT 0,
        actual_hours    DECIMAL(10,2)  NOT NULL DEFAULT 0,
        total_cost      DECIMAL(12,2)  NOT NULL DEFAULT 0,
        created_by      BIGINT         NOT NULL REFERENCES users(id),
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela work_orders criada.';
END
GO

-- ============================================================
-- TABELA: work_order_maintainers
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='work_order_maintainers' AND xtype='U')
BEGIN
    CREATE TABLE work_order_maintainers (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        work_order_id BIGINT    NOT NULL REFERENCES work_orders(id),
        maintainer_id BIGINT    NOT NULL REFERENCES maintainers(id),
        assigned_at   DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_wo_maintainer UNIQUE (work_order_id, maintainer_id)
    );
    PRINT 'Tabela work_order_maintainers criada.';
END
GO

-- ============================================================
-- TABELA: time_entries
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='time_entries' AND xtype='U')
BEGIN
    CREATE TABLE time_entries (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        work_order_id BIGINT         NOT NULL REFERENCES work_orders(id),
        maintainer_id BIGINT         NOT NULL REFERENCES maintainers(id),
        start_time    DATETIME2      NOT NULL,
        end_time      DATETIME2      NULL,
        hours         DECIMAL(10,2)  NOT NULL DEFAULT 0,
        description   NVARCHAR(500),
        status        NVARCHAR(20)   NOT NULL DEFAULT 'pending',
        approved_by   BIGINT         NULL REFERENCES users(id),
        approved_at   DATETIME2      NULL,
        created_at    DATETIME2      NOT NULL DEFAULT GETDATE(),
        updated_at    DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela time_entries criada.';
END
GO

-- ============================================================
-- SEED: Usuário administrador padrão
-- Login: admin@manuind.com  |  Senha: Admin@123
-- ============================================================
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@manuind.com')
BEGIN
    INSERT INTO users (name, email, password_hash, role)
    VALUES (
        'Administrador',
        'admin@manuind.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'admin'
    );
    PRINT 'Usuário admin criado.';
END
GO

-- ============================================================
-- SEED: Plano de Contas Gerencial inicial
-- ============================================================
IF NOT EXISTS (SELECT * FROM account_plan WHERE code = '1')
BEGIN
    INSERT INTO account_plan (parent_id, code, name, type, nature, level)
    VALUES (NULL, '1', 'CUSTOS DE MANUTENÇÃO', 'synthetic', 'debit', 1);
    DECLARE @root BIGINT = SCOPE_IDENTITY();

    -- 1.1 Mão de Obra
    INSERT INTO account_plan (parent_id, code, name, type, nature, level)
    VALUES (@root, '1.1', 'Mão de Obra', 'synthetic', 'debit', 2);
    DECLARE @mdo BIGINT = SCOPE_IDENTITY();
    INSERT INTO account_plan (parent_id, code, name, type, nature, level) VALUES
    (@mdo, '1.1.1', 'Mão de Obra Própria',         'analytical', 'debit', 3),
    (@mdo, '1.1.2', 'Mão de Obra Terceirizada',     'analytical', 'debit', 3),
    (@mdo, '1.1.3', 'Horas Extras',                 'analytical', 'debit', 3);

    -- 1.2 Materiais
    INSERT INTO account_plan (parent_id, code, name, type, nature, level)
    VALUES (@root, '1.2', 'Materiais', 'synthetic', 'debit', 2);
    DECLARE @mat BIGINT = SCOPE_IDENTITY();
    INSERT INTO account_plan (parent_id, code, name, type, nature, level) VALUES
    (@mat, '1.2.1', 'Peças de Reposição',           'analytical', 'debit', 3),
    (@mat, '1.2.2', 'Materiais de Consumo',          'analytical', 'debit', 3),
    (@mat, '1.2.3', 'Lubrificantes e Graxas',        'analytical', 'debit', 3),
    (@mat, '1.2.4', 'Ferramentas e EPIs',            'analytical', 'debit', 3);

    -- 1.3 Serviços Contratados
    INSERT INTO account_plan (parent_id, code, name, type, nature, level)
    VALUES (@root, '1.3', 'Serviços Contratados', 'synthetic', 'debit', 2);
    DECLARE @svc BIGINT = SCOPE_IDENTITY();
    INSERT INTO account_plan (parent_id, code, name, type, nature, level) VALUES
    (@svc, '1.3.1', 'Manutenção Preventiva Contratada', 'analytical', 'debit', 3),
    (@svc, '1.3.2', 'Manutenção Corretiva Contratada',  'analytical', 'debit', 3),
    (@svc, '1.3.3', 'Inspeções e Laudos Técnicos',      'analytical', 'debit', 3);

    -- 1.4 Paradas de Produção
    INSERT INTO account_plan (parent_id, code, name, type, nature, level)
    VALUES (@root, '1.4', 'Custos de Parada', 'synthetic', 'debit', 2);
    DECLARE @par BIGINT = SCOPE_IDENTITY();
    INSERT INTO account_plan (parent_id, code, name, type, nature, level) VALUES
    (@par, '1.4.1', 'Lucro Cessante',               'analytical', 'debit', 3),
    (@par, '1.4.2', 'Custos de Emergência',          'analytical', 'debit', 3);

    PRINT 'Plano de contas criado.';
END
GO

PRINT 'Migração concluída com sucesso!';
GO
