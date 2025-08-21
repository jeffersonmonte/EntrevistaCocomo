
/* ===========================================================
   SCHEMA + SEED (ATUALIZADO) — Entrevistas + COCOMO II Early Design
   Banco: SQL Server (T-SQL)
   - Corrige e padroniza SF/EM conforme COCOMO II.2000 (Early Design).
   - Adiciona níveis faltantes (XL/XH) onde aplicável.
   - Corrige bug de TipoEntrada ('PF' vs 'COSMIC') nas conversões por linguagem.
   - Usa UPSERT (UPDATE/INSERT) idempotente.
   ===========================================================*/

SET NOCOUNT ON;
BEGIN TRAN;

--------------------------------------------------------------
-- 1) Tabelas principais (mesmo schema anterior)
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
        TamanhoKloc DECIMAL(18,6) NOT NULL DEFAULT(0),
        SomaScaleFactors DECIMAL(18,6) NOT NULL DEFAULT(0),
        ProdutoEffortMultipliers DECIMAL(18,6) NOT NULL DEFAULT(0),
        EsforcoPM DECIMAL(18,6) NOT NULL DEFAULT(0),
        PrazoMeses DECIMAL(18,6) NOT NULL DEFAULT(0),
        TotalCFP INT NOT NULL DEFAULT(0)
    );

    CREATE INDEX IX_Entrevistas_Data ON dbo.Entrevistas (DataEntrevista);
    CREATE INDEX IX_Entrevistas_Nomes ON dbo.Entrevistas (NomeEntrevistado, NomeEntrevistador);
END;

IF OBJECT_ID('dbo.ScaleFactors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScaleFactors
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ScaleFactors PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(50) NOT NULL,     -- PREC, FLEX, RESL, TEAM, PMAT
        Nivel NVARCHAR(50) NOT NULL,    -- Baixissimo..Altissimo
        Valor DECIMAL(5,2) NOT NULL,    -- valor normalizado (p.ex. 6.20)
        CONSTRAINT FK_SF_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UX_SF_Entrevista_Contexto ON dbo.ScaleFactors (EntrevistaId, Nome);
END;

IF OBJECT_ID('dbo.EffortMultipliers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EffortMultipliers
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EffortMultipliers PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(50) NOT NULL,     -- RCPX,RUSE,PDIF,PERS,PREX,FCIL,SCED
        Nivel NVARCHAR(50) NOT NULL,    -- Baixissimo..Altissimo (alguns drivers usam 5 níveis)
        Valor DECIMAL(5,3) NOT NULL,    -- valor normalizado (p.ex. 0.83)
        CONSTRAINT FK_EM_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UX_EM_Entrevista_Contexto ON dbo.EffortMultipliers (EntrevistaId, Nome);
END;

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
        TipoEntrada NVARCHAR(20) NOT NULL,   -- 'PF' ou 'COSMIC'
        Contexto NVARCHAR(100) NOT NULL,     -- linguagem ou 'Geral'
        FatorConversao DECIMAL(12,6) NOT NULL
    );
    CREATE UNIQUE INDEX UX_ConversoesTamanho ON dbo.ConversoesTamanho (TipoEntrada, Contexto);
END;

IF OBJECT_ID('dbo.FatoresConversao', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FatoresConversao
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FatoresConversao PRIMARY KEY,
        TipoEntrada NVARCHAR(50) NOT NULL,    -- 'ScaleFactor' | 'EffortMultiplier'
        Contexto NVARCHAR(50) NOT NULL,       -- ex.: PREC, FLEX, RCPX, ...
        Nivel NVARCHAR(50) NOT NULL,          -- Baixissimo..Altissimo
        FatorConversao DECIMAL(18,6) NOT NULL,
        NomeCompleto NVARCHAR(150) NULL,
        Descricao NVARCHAR(500) NULL
    );
    CREATE UNIQUE INDEX UX_FatoresConversao ON dbo.FatoresConversao (TipoEntrada, Contexto, Nivel);
END;

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
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_Medicoes_Func UNIQUE (EntrevistaId, Nome)
    );
END;

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
            REFERENCES dbo.Funcionalidades(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_Medicoes_Func UNIQUE (FuncionalidadeId)
    );
END;

--------------------------------------------------------------
-- 2) Parâmetros padrão
--------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.ParametrosCocomo)
BEGIN
    INSERT INTO dbo.ParametrosCocomo (A,B,C,D)
    VALUES (2.94, 0.91, 3.67, 0.28);
END;

--------------------------------------------------------------
-- 3) Conversões de tamanho (corrige 'PF' vs 'COSMIC')
--------------------------------------------------------------
-- COSMIC genérico (CFP->KLOC): ex. 0.025 KLOC por CFP
IF EXISTS (SELECT 1 FROM dbo.ConversoesTamanho WHERE TipoEntrada='COSMIC' AND Contexto='Geral')
    UPDATE dbo.ConversoesTamanho SET FatorConversao=0.025 WHERE TipoEntrada='COSMIC' AND Contexto='Geral';
ELSE
    INSERT INTO dbo.ConversoesTamanho (TipoEntrada, Contexto, FatorConversao) VALUES ('COSMIC','Geral',0.025);

-- PF -> KLOC por linguagem (exemplos; ajuste conforme sua calibração)
DECLARE @PF TABLE(Contexto NVARCHAR(100), Fator DECIMAL(12,6));
INSERT INTO @PF(Contexto,Fator) VALUES
('C#',53.000000), ('ASP.NET',50.000000), ('Java',53.000000),
('React',30.000000), ('Node.js',40.000000), ('Python',42.000000);

MERGE dbo.ConversoesTamanho AS T
USING (SELECT 'PF' AS TipoEntrada, P.Contexto, P.Fator FROM @PF AS P) AS S
ON (T.TipoEntrada='PF' AND T.Contexto=S.Contexto)
WHEN MATCHED THEN UPDATE SET FatorConversao=S.Fator
WHEN NOT MATCHED THEN INSERT (TipoEntrada,Contexto,FatorConversao) VALUES (S.TipoEntrada,S.Contexto,S.Fator);

--------------------------------------------------------------
-- 4) Fatores (SF/EM) — UPSERT com valores oficiais Early Design
--    Níveis em pt-BR sugeridos:
--    XL=Baixissimo, VL=MuitoBaixo, L=Baixo, N=Nominal, H=Alto, VH=MuitoAlto, XH=Altissimo
--------------------------------------------------------------

-- Helper: UPSERT fator
CREATE TABLE #tmp_fator (
    TipoEntrada NVARCHAR(50),
    Contexto NVARCHAR(50),
    Nivel NVARCHAR(50),
    FatorConversao DECIMAL(18,6),
    NomeCompleto NVARCHAR(150),
    Descricao NVARCHAR(500)
);

-- SF (PREC, FLEX, RESL, TEAM, PMAT) - 6 níveis (VL..XH=0.00)
INSERT INTO #tmp_fator VALUES
('ScaleFactor','PREC','MuitoBaixo',6.20,'Precedência do Projeto','Nível de experiência em projetos similares.'),
('ScaleFactor','PREC','Baixo',4.96,'Precedência do Projeto','Nível de experiência em projetos similares.'),
('ScaleFactor','PREC','Nominal',3.72,'Precedência do Projeto','Nível de experiência em projetos similares.'),
('ScaleFactor','PREC','Alto',2.48,'Precedência do Projeto','Nível de experiência em projetos similares.'),
('ScaleFactor','PREC','MuitoAlto',1.24,'Precedência do Projeto','Nível de experiência em projetos similares.'),
('ScaleFactor','PREC','Altissimo',0.00,'Precedência do Projeto','Nível de experiência em projetos similares.'),

('ScaleFactor','FLEX','MuitoBaixo',5.07,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
('ScaleFactor','FLEX','Baixo',4.05,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
('ScaleFactor','FLEX','Nominal',3.04,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
('ScaleFactor','FLEX','Alto',2.03,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
('ScaleFactor','FLEX','MuitoAlto',1.01,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
('ScaleFactor','FLEX','Altissimo',0.00,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),

('ScaleFactor','RESL','MuitoBaixo',7.07,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
('ScaleFactor','RESL','Baixo',5.65,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
('ScaleFactor','RESL','Nominal',4.24,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
('ScaleFactor','RESL','Alto',2.83,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
('ScaleFactor','RESL','MuitoAlto',1.41,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
('ScaleFactor','RESL','Altissimo',0.00,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),

('ScaleFactor','TEAM','MuitoBaixo',5.48,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
('ScaleFactor','TEAM','Baixo',4.38,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
('ScaleFactor','TEAM','Nominal',3.29,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
('ScaleFactor','TEAM','Alto',2.19,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
('ScaleFactor','TEAM','MuitoAlto',1.10,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
('ScaleFactor','TEAM','Altissimo',0.00,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),

('ScaleFactor','PMAT','MuitoBaixo',7.80,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
('ScaleFactor','PMAT','Baixo',6.24,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
('ScaleFactor','PMAT','Nominal',4.68,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
('ScaleFactor','PMAT','Alto',3.12,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
('ScaleFactor','PMAT','MuitoAlto',1.56,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
('ScaleFactor','PMAT','Altissimo',0.00,'Maturidade do Processo','Nível de formalização de processos (CMMI).');

-- EM — RCPX (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','RCPX','Baixissimo',0.49,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
('EffortMultiplier','RCPX','MuitoBaixo',0.60,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
('EffortMultiplier','RCPX','Baixo',0.83,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
('EffortMultiplier','RCPX','Nominal',1.00,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
('EffortMultiplier','RCPX','Alto',1.33,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
('EffortMultiplier','RCPX','MuitoAlto',1.91,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
('EffortMultiplier','RCPX','Altissimo',2.72,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.');

-- EM — RUSE (5 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','RUSE','MuitoBaixo',0.95,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
('EffortMultiplier','RUSE','Baixo',1.00,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
('EffortMultiplier','RUSE','Nominal',1.07,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
('EffortMultiplier','RUSE','Alto',1.15,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
('EffortMultiplier','RUSE','MuitoAlto',1.24,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.');

-- EM — PDIF (5 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','PDIF','MuitoBaixo',0.87,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
('EffortMultiplier','PDIF','Baixo',1.00,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
('EffortMultiplier','PDIF','Nominal',1.29,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
('EffortMultiplier','PDIF','Alto',1.81,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
('EffortMultiplier','PDIF','MuitoAlto',2.61,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.');

-- EM — PERS (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','PERS','Baixissimo',2.12,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
('EffortMultiplier','PERS','MuitoBaixo',1.62,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
('EffortMultiplier','PERS','Baixo',1.26,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
('EffortMultiplier','PERS','Nominal',1.00,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
('EffortMultiplier','PERS','Alto',0.83,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
('EffortMultiplier','PERS','MuitoAlto',0.63,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
('EffortMultiplier','PERS','Altissimo',0.50,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.');

-- EM — PREX (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','PREX','Baixissimo',1.59,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
('EffortMultiplier','PREX','MuitoBaixo',1.33,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
('EffortMultiplier','PREX','Baixo',1.12,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
('EffortMultiplier','PREX','Nominal',1.00,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
('EffortMultiplier','PREX','Alto',0.87,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
('EffortMultiplier','PREX','MuitoAlto',0.74,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
('EffortMultiplier','PREX','Altissimo',0.62,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.');

-- EM — FCIL (7 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','FCIL','Baixissimo',1.43,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
('EffortMultiplier','FCIL','MuitoBaixo',1.30,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
('EffortMultiplier','FCIL','Baixo',1.10,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
('EffortMultiplier','FCIL','Nominal',1.00,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
('EffortMultiplier','FCIL','Alto',0.87,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
('EffortMultiplier','FCIL','MuitoAlto',0.73,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
('EffortMultiplier','FCIL','Altissimo',0.62,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.');

-- EM — SCED (5 níveis)
INSERT INTO #tmp_fator VALUES
('EffortMultiplier','SCED','MuitoBaixo',1.43,'Pressão de Cronograma','Aceleração do cronograma (compressão de 75%).'),
('EffortMultiplier','SCED','Baixo',1.14,'Pressão de Cronograma','Aceleração do cronograma (compressão de 85%).'),
('EffortMultiplier','SCED','Nominal',1.00,'Pressão de Cronograma','Cronograma nominal.'),
('EffortMultiplier','SCED','Alto',1.00,'Pressão de Cronograma','Cronograma relaxado (sem ganho em esforço no Early Design).'),
('EffortMultiplier','SCED','MuitoAlto',1.00,'Pressão de Cronograma','Cronograma muito relaxado (idem).');

-- UPSERT para todos registros temporários
MERGE dbo.FatoresConversao AS T
USING #tmp_fator AS S
ON (T.TipoEntrada=S.TipoEntrada AND T.Contexto=S.Contexto AND T.Nivel=S.Nivel)
WHEN MATCHED THEN UPDATE SET
    FatorConversao = S.FatorConversao,
    NomeCompleto   = S.NomeCompleto,
    Descricao      = S.Descricao
WHEN NOT MATCHED THEN INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
VALUES (S.TipoEntrada,S.Contexto,S.Nivel,S.FatorConversao,S.NomeCompleto,S.Descricao);

DROP TABLE #tmp_fator;

COMMIT TRAN;
PRINT 'Schema/Seed atualizado com sucesso (COCOMO II Early Design).';
