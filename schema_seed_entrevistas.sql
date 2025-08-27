
/* ===========================================================
   SCHEMA + SEED (CORRIGIDO) — Entrevistas + COCOMO II Early Design
   Banco: SQL Server (T-SQL)
   - Alinha nomes de índices/constraints aos mapeamentos do EF Core.
   - Garante precisões/escala das colunas DECIMAL conforme AppDbContext.
   - Mantém INSERTs/UPSERTs úteis (Parâmetros, Conversões, Fatores).
   - Idempotente (não destrutivo) para rodar múltiplas vezes.
   ===========================================================*/

SET NOCOUNT ON;
BEGIN TRAN;

--------------------------------------------------------------
-- 0) Helpers
--------------------------------------------------------------
DECLARE @has INT;

--------------------------------------------------------------
-- 1) Tabelas principais
--------------------------------------------------------------
IF OBJECT_ID('dbo.Entrevistas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Entrevistas
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Entrevistas PRIMARY KEY,
        NomeEntrevista NVARCHAR(120) NOT NULL,
        NomeEntrevistado NVARCHAR(100) NOT NULL,
        NomeEntrevistador NVARCHAR(100) NOT NULL,
        DataEntrevista DATE NOT NULL,
        TipoEntrada INT NOT NULL,
        Linguagem NVARCHAR(100) NULL,
        TamanhoKloc DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_TamanhoKloc DEFAULT(0),
        SomaScaleFactors DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_SomaSF DEFAULT(0),
        ProdutoEffortMultipliers DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_ProdEM DEFAULT(0),
        EsforcoPM DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_PM DEFAULT(0),
        PrazoMeses DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_Prazo DEFAULT(0),
        TotalCFP INT NOT NULL CONSTRAINT DF_Entrevistas_TotalCFP DEFAULT(0)
    );
END
ELSE
BEGIN
    -- ADD colunas novas se não existirem
    IF COL_LENGTH('dbo.Entrevistas','TamanhoKloc') IS NULL
        ALTER TABLE dbo.Entrevistas ADD TamanhoKloc DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_TamanhoKloc DEFAULT(0);
    IF COL_LENGTH('dbo.Entrevistas','SomaScaleFactors') IS NULL
        ALTER TABLE dbo.Entrevistas ADD SomaScaleFactors DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_SomaSF DEFAULT(0);
    IF COL_LENGTH('dbo.Entrevistas','ProdutoEffortMultipliers') IS NULL
        ALTER TABLE dbo.Entrevistas ADD ProdutoEffortMultipliers DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_ProdEM DEFAULT(0);
    IF COL_LENGTH('dbo.Entrevistas','EsforcoPM') IS NULL
        ALTER TABLE dbo.Entrevistas ADD EsforcoPM DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_PM DEFAULT(0);
    IF COL_LENGTH('dbo.Entrevistas','PrazoMeses') IS NULL
        ALTER TABLE dbo.Entrevistas ADD PrazoMeses DECIMAL(18,6) NOT NULL CONSTRAINT DF_Entrevistas_Prazo DEFAULT(0);
    IF COL_LENGTH('dbo.Entrevistas','TotalCFP') IS NULL
        ALTER TABLE dbo.Entrevistas ADD TotalCFP INT NOT NULL CONSTRAINT DF_Entrevistas_TotalCFP DEFAULT(0);
END;

-- Índices auxiliares
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Entrevistas_Data' AND object_id=OBJECT_ID('dbo.Entrevistas'))
    CREATE INDEX IX_Entrevistas_Data ON dbo.Entrevistas (DataEntrevista);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Entrevistas_Nomes' AND object_id=OBJECT_ID('dbo.Entrevistas'))
    CREATE INDEX IX_Entrevistas_Nomes ON dbo.Entrevistas (NomeEntrevistado, NomeEntrevistador);

IF OBJECT_ID('dbo.ScaleFactors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScaleFactors
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ScaleFactors PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(50) NOT NULL,     -- PREC, FLEX, RESL, TEAM, PMAT
        Nivel NVARCHAR(50) NOT NULL,    -- Baixissimo..Altissimo
        Valor DECIMAL(5,2) NOT NULL,    -- valor normalizado
        CONSTRAINT FK_SF_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_SF_Entrevista_Nome' AND object_id=OBJECT_ID('dbo.ScaleFactors'))
    CREATE UNIQUE INDEX UX_SF_Entrevista_Nome ON dbo.ScaleFactors (EntrevistaId, Nome);

IF OBJECT_ID('dbo.EffortMultipliers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EffortMultipliers
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EffortMultipliers PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(50) NOT NULL,     -- RCPX,RUSE,PDIF,PERS,PREX,FCIL,SCED
        Nivel NVARCHAR(50) NOT NULL,    -- níveis podem variar (5-7)
        Valor DECIMAL(5,3) NOT NULL,    -- valor normalizado
        CONSTRAINT FK_EM_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_EM_Entrevista_Nome' AND object_id=OBJECT_ID('dbo.EffortMultipliers'))
    CREATE UNIQUE INDEX UX_EM_Entrevista_Nome ON dbo.EffortMultipliers (EntrevistaId, Nome);

IF OBJECT_ID('dbo.Funcionalidades', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Funcionalidades
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Funcionalidades PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(200) NOT NULL,
        Template NVARCHAR(20) NULL,
        Observacoes NVARCHAR(MAX) NULL,
        CONSTRAINT FK_Func_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );
END;
-- Drop possível constraint antiga com nome conflitante
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type]='UQ' AND name='UQ_Medicoes_Func' AND parent_object_id=OBJECT_ID('dbo.Funcionalidades'))
    ALTER TABLE dbo.Funcionalidades DROP CONSTRAINT UQ_Medicoes_Func;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_Medicoes_Func' AND object_id=OBJECT_ID('dbo.Funcionalidades'))
    DROP INDEX UQ_Medicoes_Func ON dbo.Funcionalidades;
-- Cria UQ correta
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_Funcionalidade_Entrevista_Nome' AND object_id=OBJECT_ID('dbo.Funcionalidades'))
    CREATE UNIQUE INDEX UQ_Funcionalidade_Entrevista_Nome ON dbo.Funcionalidades (EntrevistaId, Nome);

IF OBJECT_ID('dbo.MedicoesCosmic', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MedicoesCosmic
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_MedicoesCosmic PRIMARY KEY,
        FuncionalidadeId UNIQUEIDENTIFIER NOT NULL,
        EntryE INT NOT NULL CONSTRAINT DF_MedicoesCosmic_EntryE DEFAULT(0),
        ExitX INT NOT NULL CONSTRAINT DF_MedicoesCosmic_ExitX DEFAULT(0),
        ReadR INT NOT NULL CONSTRAINT DF_MedicoesCosmic_ReadR DEFAULT(0),
        WriteW INT NOT NULL CONSTRAINT DF_MedicoesCosmic_WriteW DEFAULT(0),
        CONSTRAINT FK_Medicoes_Func FOREIGN KEY (FuncionalidadeId)
            REFERENCES dbo.Funcionalidades(Id) ON DELETE CASCADE
    );
END;
-- Ajusta UQ em FuncionalidadeId
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type]='UQ' AND name='UQ_Medicoes_Func' AND parent_object_id=OBJECT_ID('dbo.MedicoesCosmic'))
    ALTER TABLE dbo.MedicoesCosmic DROP CONSTRAINT UQ_Medicoes_Func;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_Medicoes_Func' AND object_id=OBJECT_ID('dbo.MedicoesCosmic'))
    DROP INDEX UQ_Medicoes_Func ON dbo.MedicoesCosmic;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_MedicaoCosmic_Funcionalidade' AND object_id=OBJECT_ID('dbo.MedicoesCosmic'))
    CREATE UNIQUE INDEX UQ_MedicaoCosmic_Funcionalidade ON dbo.MedicoesCosmic (FuncionalidadeId);

--------------------------------------------------------------
-- 2) Tabelas auxiliares
--------------------------------------------------------------
IF OBJECT_ID('dbo.ParametrosCocomo', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ParametrosCocomo
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ParametrosCocomo PRIMARY KEY,
        A DECIMAL(8,4) NOT NULL,
        B DECIMAL(8,4) NOT NULL,
        C DECIMAL(8,4) NOT NULL,
        D DECIMAL(8,4) NOT NULL
    );
END;

IF OBJECT_ID('dbo.ConversoesTamanho', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConversoesTamanho
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ConversoesTamanho PRIMARY KEY,
        TipoEntrada NVARCHAR(20) NOT NULL,   -- 'PF' | 'COSMIC'
        Contexto NVARCHAR(100) NOT NULL,     -- linguagem ou 'Geral'
        FatorConversao DECIMAL(12,6) NOT NULL
    );
END;
-- Índice único
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_ConversoesTamanho' AND object_id=OBJECT_ID('dbo.ConversoesTamanho'))
    CREATE UNIQUE INDEX UX_ConversoesTamanho ON dbo.ConversoesTamanho (TipoEntrada, Contexto);
-- Garante escala
ALTER TABLE dbo.ConversoesTamanho ALTER COLUMN FatorConversao DECIMAL(12,6) NOT NULL;

IF OBJECT_ID('dbo.FatoresConversao', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FatoresConversao
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FatoresConversao PRIMARY KEY,
        TipoEntrada NVARCHAR(50) NOT NULL,    -- 'ScaleFactor' | 'EffortMultiplier'
        Contexto NVARCHAR(50) NOT NULL,       -- PREC, FLEX, RCPX, etc.
        Nivel NVARCHAR(50) NOT NULL,          -- Baixissimo..Altissimo
        FatorConversao DECIMAL(18,6) NOT NULL,
        NomeCompleto NVARCHAR(150) NULL,
        Descricao NVARCHAR(500) NULL
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_FatoresConversao' AND object_id=OBJECT_ID('dbo.FatoresConversao'))
    CREATE UNIQUE INDEX UX_FatoresConversao ON dbo.FatoresConversao (TipoEntrada, Contexto, Nivel);

--------------------------------------------------------------
-- 3) Parâmetros padrão COCOMO (Early Design)
--------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.ParametrosCocomo)
BEGIN
    INSERT INTO dbo.ParametrosCocomo (A,B,C,D)
    VALUES (2.94, 0.91, 3.67, 0.28);
END;

--------------------------------------------------------------
-- 4) Conversões de Tamanho (UPSERT)
--    OBS: valores PF abaixo são em KLOC por PF (ex.: 53 LOC/FP = 0.053 KLOC/FP)
--------------------------------------------------------------
-- COSMIC genérico (CFP -> KLOC)
IF EXISTS (SELECT 1 FROM dbo.ConversoesTamanho WHERE TipoEntrada='COSMIC' AND Contexto='Geral')
    UPDATE dbo.ConversoesTamanho SET FatorConversao=0.025 WHERE TipoEntrada='COSMIC' AND Contexto='Geral';
ELSE
    INSERT INTO dbo.ConversoesTamanho (TipoEntrada, Contexto, FatorConversao)
    VALUES ('COSMIC','Geral',0.025);

-- PF por linguagem (exemplos; ajuste conforme calibração local)
DECLARE @PF TABLE(Contexto NVARCHAR(100), Fator DECIMAL(12,6));
INSERT INTO @PF(Contexto,Fator) VALUES
('C#',0.053000),      -- ~53 LOC/FP
('ASP.NET',0.050000), -- ~50 LOC/FP
('Java',0.053000),    -- ~53 LOC/FP
('React',0.030000),   -- ~30 LOC/FP (front-end costuma ser menor)
('Node.js',0.040000), -- ~40 LOC/FP
('Python',0.042000);  -- ~42 LOC/FP

MERGE dbo.ConversoesTamanho AS T
USING (SELECT 'PF' AS TipoEntrada, P.Contexto, P.Fator FROM @PF AS P) AS S
ON (T.TipoEntrada='PF' AND T.Contexto=S.Contexto)
WHEN MATCHED THEN UPDATE SET FatorConversao=S.Fator
WHEN NOT MATCHED THEN INSERT (TipoEntrada,Contexto,FatorConversao) VALUES (S.TipoEntrada,S.Contexto,S.Fator);

--------------------------------------------------------------
-- 5) Fatores (SF/EM) — UPSERT (Early Design)
--------------------------------------------------------------
IF OBJECT_ID('tempdb..#tmp_fator') IS NOT NULL DROP TABLE #tmp_fator;
CREATE TABLE #tmp_fator (
    TipoEntrada NVARCHAR(50),
    Contexto NVARCHAR(50),
    Nivel NVARCHAR(50),
    FatorConversao DECIMAL(18,6),
    NomeCompleto NVARCHAR(150),
    Descricao NVARCHAR(500)
);

-- SF (PREC, FLEX, RESL, TEAM, PMAT) - inclui 'Altissimo'=0.00
INSERT INTO #tmp_fator VALUES
('ScaleFactor','PREC','MuitoBaixo',6.20,'Precedência do Projeto','Histórico de projetos similares'),
('ScaleFactor','PREC','Baixo',4.96,'Precedência do Projeto','Histórico de projetos similares'),
('ScaleFactor','PREC','Nominal',3.72,'Precedência do Projeto','Histórico de projetos similares'),
('ScaleFactor','PREC','Alto',2.48,'Precedência do Projeto','Histórico de projetos similares'),
('ScaleFactor','PREC','MuitoAlto',1.24,'Precedência do Projeto','Histórico de projetos similares'),
('ScaleFactor','PREC','Altissimo',0.00,'Precedência do Projeto','Histórico de projetos similares'),

('ScaleFactor','FLEX','MuitoBaixo',5.07,'Flexibilidade de Processo','Liberdade de processo'),
('ScaleFactor','FLEX','Baixo',4.05,'Flexibilidade de Processo','Liberdade de processo'),
('ScaleFactor','FLEX','Nominal',3.04,'Flexibilidade de Processo','Liberdade de processo'),
('ScaleFactor','FLEX','Alto',2.03,'Flexibilidade de Processo','Liberdade de processo'),
('ScaleFactor','FLEX','MuitoAlto',1.01,'Flexibilidade de Processo','Liberdade de processo'),
('ScaleFactor','FLEX','Altissimo',0.00,'Flexibilidade de Processo','Liberdade de processo'),

('ScaleFactor','RESL','MuitoBaixo',7.07,'Resolução de Riscos','Maturidade para riscos'),
('ScaleFactor','RESL','Baixo',5.65,'Resolução de Riscos','Maturidade para riscos'),
('ScaleFactor','RESL','Nominal',4.24,'Resolução de Riscos','Maturidade para riscos'),
('ScaleFactor','RESL','Alto',2.83,'Resolução de Riscos','Maturidade para riscos'),
('ScaleFactor','RESL','MuitoAlto',1.41,'Resolução de Riscos','Maturidade para riscos'),
('ScaleFactor','RESL','Altissimo',0.00,'Resolução de Riscos','Maturidade para riscos'),

('ScaleFactor','TEAM','MuitoBaixo',5.48,'Coesão da Equipe','Trabalho em equipe'),
('ScaleFactor','TEAM','Baixo',4.38,'Coesão da Equipe','Trabalho em equipe'),
('ScaleFactor','TEAM','Nominal',3.29,'Coesão da Equipe','Trabalho em equipe'),
('ScaleFactor','TEAM','Alto',2.19,'Coesão da Equipe','Trabalho em equipe'),
('ScaleFactor','TEAM','MuitoAlto',1.10,'Coesão da Equipe','Trabalho em equipe'),
('ScaleFactor','TEAM','Altissimo',0.00,'Coesão da Equipe','Trabalho em equipe'),

('ScaleFactor','PMAT','MuitoBaixo',7.80,'Maturidade do Processo','CMMI/Processos'),
('ScaleFactor','PMAT','Baixo',6.24,'Maturidade do Processo','CMMI/Processos'),
('ScaleFactor','PMAT','Nominal',4.68,'Maturidade do Processo','CMMI/Processos'),
('ScaleFactor','PMAT','Alto',3.12,'Maturidade do Processo','CMMI/Processos'),
('ScaleFactor','PMAT','MuitoAlto',1.56,'Maturidade do Processo','CMMI/Processos'),
('ScaleFactor','PMAT','Altissimo',0.00,'Maturidade do Processo','CMMI/Processos');

-- EM — RCPX (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','RCPX','Baixissimo',0.49,'Complexidade do Produto','Complexidade geral do produto'),
('EffortMultiplier','RCPX','MuitoBaixo',0.60,'Complexidade do Produto','Complexidade geral do produto'),
('EffortMultiplier','RCPX','Baixo',0.83,'Complexidade do Produto','Complexidade geral do produto'),
('EffortMultiplier','RCPX','Nominal',1.00,'Complexidade do Produto','Complexidade geral do produto'),
('EffortMultiplier','RCPX','Alto',1.33,'Complexidade do Produto','Complexidade geral do produto'),
('EffortMultiplier','RCPX','MuitoAlto',1.91,'Complexidade do Produto','Complexidade geral do produto'),
('EffortMultiplier','RCPX','Altissimo',2.72,'Complexidade do Produto','Complexidade geral do produto');

-- EM — RUSE (5 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','RUSE','MuitoBaixo',0.95,'Reusabilidade Requerida','Reuso exigido'),
('EffortMultiplier','RUSE','Baixo',1.00,'Reusabilidade Requerida','Reuso exigido'),
('EffortMultiplier','RUSE','Nominal',1.07,'Reusabilidade Requerida','Reuso exigido'),
('EffortMultiplier','RUSE','Alto',1.15,'Reusabilidade Requerida','Reuso exigido'),
('EffortMultiplier','RUSE','MuitoAlto',1.24,'Reusabilidade Requerida','Reuso exigido');

-- EM — PDIF (5 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','PDIF','MuitoBaixo',0.87,'Dificuldade da Plataforma','Restrições de plataforma'),
('EffortMultiplier','PDIF','Baixo',1.00,'Dificuldade da Plataforma','Restrições de plataforma'),
('EffortMultiplier','PDIF','Nominal',1.29,'Dificuldade da Plataforma','Restrições de plataforma'),
('EffortMultiplier','PDIF','Alto',1.81,'Dificuldade da Plataforma','Restrições de plataforma'),
('EffortMultiplier','PDIF','MuitoAlto',2.61,'Dificuldade da Plataforma','Restrições de plataforma');

-- EM — PERS (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','PERS','Baixissimo',2.12,'Capacidade da Equipe','Capacidade técnica'),
('EffortMultiplier','PERS','MuitoBaixo',1.62,'Capacidade da Equipe','Capacidade técnica'),
('EffortMultiplier','PERS','Baixo',1.26,'Capacidade da Equipe','Capacidade técnica'),
('EffortMultiplier','PERS','Nominal',1.00,'Capacidade da Equipe','Capacidade técnica'),
('EffortMultiplier','PERS','Alto',0.83,'Capacidade da Equipe','Capacidade técnica'),
('EffortMultiplier','PERS','MuitoAlto',0.63,'Capacidade da Equipe','Capacidade técnica'),
('EffortMultiplier','PERS','Altissimo',0.50,'Capacidade da Equipe','Capacidade técnica');

-- EM — PREX (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','PREX','Baixissimo',1.59,'Experiência da Equipe','Experiência do time'),
('EffortMultiplier','PREX','MuitoBaixo',1.33,'Experiência da Equipe','Experiência do time'),
('EffortMultiplier','PREX','Baixo',1.12,'Experiência da Equipe','Experiência do time'),
('EffortMultiplier','PREX','Nominal',1.00,'Experiência da Equipe','Experiência do time'),
('EffortMultiplier','PREX','Alto',0.87,'Experiência da Equipe','Experiência do time'),
('EffortMultiplier','PREX','MuitoAlto',0.74,'Experiência da Equipe','Experiência do time'),
('EffortMultiplier','PREX','Altissimo',0.62,'Experiência da Equipe','Experiência do time');

-- EM — FCIL (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','FCIL','Baixissimo',1.43,'Apoio de Ferramentas','Ferramentas e automações'),
('EffortMultiplier','FCIL','MuitoBaixo',1.30,'Apoio de Ferramentas','Ferramentas e automações'),
('EffortMultiplier','FCIL','Baixo',1.10,'Apoio de Ferramentas','Ferramentas e automações'),
('EffortMultiplier','FCIL','Nominal',1.00,'Apoio de Ferramentas','Ferramentas e automações'),
('EffortMultiplier','FCIL','Alto',0.87,'Apoio de Ferramentas','Ferramentas e automações'),
('EffortMultiplier','FCIL','MuitoAlto',0.73,'Apoio de Ferramentas','Ferramentas e automações'),
('EffortMultiplier','FCIL','Altissimo',0.62,'Apoio de Ferramentas','Ferramentas e automações');

-- EM — SCED (5 níveis) — no Early Design não reduz esforço abaixo de 1.00
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','SCED','MuitoBaixo',1.43,'Pressão de Cronograma','Compressão ~75%'),
('EffortMultiplier','SCED','Baixo',1.14,'Pressão de Cronograma','Compressão ~85%'),
('EffortMultiplier','SCED','Nominal',1.00,'Pressão de Cronograma','Nominal'),
('EffortMultiplier','SCED','Alto',1.00,'Pressão de Cronograma','Relaxado'),
('EffortMultiplier','SCED','MuitoAlto',1.00,'Pressão de Cronograma','Muito Relaxado');

-- UPSERT em FatoresConversao
MERGE dbo.FatoresConversao AS T
USING #tmp_fator AS S
ON (T.TipoEntrada=S.TipoEntrada AND T.Contexto=S.Contexto AND T.Nivel=S.Nivel)
WHEN MATCHED THEN UPDATE SET
    FatorConversao = S.FatorConversao,
    NomeCompleto   = S.NomeCompleto,
    Descricao      = S.Descricao
WHEN NOT MATCHED THEN
    INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
    VALUES (S.TipoEntrada,S.Contexto,S.Nivel,S.FatorConversao,S.NomeCompleto,S.Descricao);

DROP TABLE #tmp_fator;

COMMIT TRAN;
PRINT 'Schema e Seed corrigidos e sincronizados com o backend (COCOMO II ED).';
