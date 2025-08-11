
/* ===========================================================
   SCHEMA + SEED — Entrevistas + COCOMO II Early Design
   Banco: SQL Server (T-SQL)
   Gera tabelas conforme Entrevistas.Infrastructure.Database.AppDbContext
   ===========================================================*/

SET NOCOUNT ON;

BEGIN TRAN;

--------------------------------------------------------------
-- 1) Tabelas principais
--------------------------------------------------------------

IF OBJECT_ID('dbo.Entrevistas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Entrevistas
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Entrevistas PRIMARY KEY,
        NomeEntrevistado NVARCHAR(100) NOT NULL,
        NomeEntrevistador NVARCHAR(100) NOT NULL,
        DataEntrevista DATE NOT NULL,
        TipoEntrada INT NOT NULL,                 -- enum TipoEntradaTamanho
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

-- ScaleFactors por entrevista
IF OBJECT_ID('dbo.ScaleFactors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScaleFactors
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ScaleFactors PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(50) NOT NULL,     -- PREC, FLEX, RESL, TEAM, PMAT
        Nivel NVARCHAR(50) NOT NULL,    -- MuitoBaixo..MuitoAlto
        Valor DECIMAL(5,2) NOT NULL,    -- conforme AppDbContext

        CONSTRAINT FK_SF_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_SF_Entrevista_Contexto ON dbo.ScaleFactors (EntrevistaId, Nome);
END;

-- EffortMultipliers por entrevista
IF OBJECT_ID('dbo.EffortMultipliers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EffortMultipliers
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EffortMultipliers PRIMARY KEY,
        EntrevistaId UNIQUEIDENTIFIER NOT NULL,
        Nome NVARCHAR(50) NOT NULL,     -- RCPX,RUSE,PDIF,PERS,PREX,FCIL,SCED
        Nivel NVARCHAR(50) NOT NULL,    -- MuitoBaixo..MuitoAlto
        Valor DECIMAL(5,3) NOT NULL,    -- conforme AppDbContext

        CONSTRAINT FK_EM_Entrevistas FOREIGN KEY (EntrevistaId)
            REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX UX_EM_Entrevista_Contexto ON dbo.EffortMultipliers (EntrevistaId, Nome);
END;

-- Parâmetros COCOMO
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

-- Conversões de Tamanho (PF/COSMIC -> KLOC)
IF OBJECT_ID('dbo.ConversoesTamanho', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConversoesTamanho
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ConversoesTamanho PRIMARY KEY,
        TipoEntrada NVARCHAR(20) NOT NULL,   -- 'PF' ou 'COSMIC'
        Contexto NVARCHAR(100) NOT NULL,     -- linguagem ou 'Geral'
        FatorConversao DECIMAL(8,4) NOT NULL
    );
    CREATE UNIQUE INDEX UX_ConversoesTamanho ON dbo.ConversoesTamanho (TipoEntrada, Contexto);
END;

-- Tabela mestre com valores por nível (SF/EM) + nomes/descrições
IF OBJECT_ID('dbo.FatoresConversao', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FatoresConversao
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FatoresConversao PRIMARY KEY,
        TipoEntrada NVARCHAR(50) NOT NULL,    -- 'ScaleFactor' | 'EffortMultiplier'
        Contexto NVARCHAR(50) NOT NULL,       -- ex.: PREC, FLEX, RCPX, ...
        Nivel NVARCHAR(50) NOT NULL,          -- MuitoBaixo..MuitoAlto
        FatorConversao DECIMAL(18,6) NOT NULL,
        NomeCompleto NVARCHAR(150) NULL,
        Descricao NVARCHAR(500) NULL
    );
    CREATE UNIQUE INDEX UX_FatoresConversao ON dbo.FatoresConversao (TipoEntrada, Contexto, Nivel);
END;

-- Funcionalidades (COSMIC)
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

-- Medições COSMIC (1:1 com Funcionalidade)
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
-- 2) SEEDs
--------------------------------------------------------------

-- Parâmetros COCOMO (uma linha default)
IF NOT EXISTS (SELECT 1 FROM dbo.ParametrosCocomo)
BEGIN
    INSERT INTO dbo.ParametrosCocomo (A,B,C,D)
    VALUES (2.94, 0.91, 3.67, 0.28);
END;

-- Conversões COSMIC -> KLOC (Geral)
IF NOT EXISTS (SELECT 1 FROM dbo.ConversoesTamanho WHERE TipoEntrada='COSMIC' AND Contexto='Geral')
BEGIN
    INSERT INTO dbo.ConversoesTamanho (TipoEntrada, Contexto, FatorConversao)
    VALUES ('COSMIC', 'Geral', 0.025);
END;

-- Conversões PF -> KLOC por linguagem (exemplos)
IF NOT EXISTS (SELECT 1 FROM dbo.ConversoesTamanho WHERE TipoEntrada='PF' AND Contexto='C#')
BEGIN
    INSERT INTO dbo.ConversoesTamanho (TipoEntrada, Contexto, FatorConversao) VALUES
    ('PF', 'C#', 53.0),
    ('PF', 'ASP.NET', 50.0),
    ('PF', 'Java', 53.0),
    ('PF', 'React', 30.0),
    ('PF', 'Node.js', 40.0),
    ('PF', 'Python', 42.0);
END;

-- SCALE FACTORS (SF)
IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='ScaleFactor' AND Contexto='PREC')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('ScaleFactor','PREC','MuitoBaixo',6.20,'Precedência do Projeto','Nível de experiência em projetos similares.'),
    ('ScaleFactor','PREC','Baixo',4.96,'Precedência do Projeto','Nível de experiência em projetos similares.'),
    ('ScaleFactor','PREC','Nominal',3.72,'Precedência do Projeto','Nível de experiência em projetos similares.'),
    ('ScaleFactor','PREC','Alto',2.48,'Precedência do Projeto','Nível de experiência em projetos similares.'),
    ('ScaleFactor','PREC','MuitoAlto',1.24,'Precedência do Projeto','Nível de experiência em projetos similares.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='ScaleFactor' AND Contexto='FLEX')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('ScaleFactor','FLEX','MuitoBaixo',5.07,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
    ('ScaleFactor','FLEX','Baixo',4.05,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
    ('ScaleFactor','FLEX','Nominal',3.04,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
    ('ScaleFactor','FLEX','Alto',2.03,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.'),
    ('ScaleFactor','FLEX','MuitoAlto',1.01,'Flexibilidade de Processo','Liberdade para seguir processos diferentes.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='ScaleFactor' AND Contexto='RESL')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('ScaleFactor','RESL','MuitoBaixo',7.07,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
    ('ScaleFactor','RESL','Baixo',5.65,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
    ('ScaleFactor','RESL','Nominal',4.24,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
    ('ScaleFactor','RESL','Alto',2.83,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.'),
    ('ScaleFactor','RESL','MuitoAlto',1.41,'Resolução de Riscos','Maturidade da equipe em prever/tratar riscos.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='ScaleFactor' AND Contexto='TEAM')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('ScaleFactor','TEAM','MuitoBaixo',5.48,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
    ('ScaleFactor','TEAM','Baixo',4.38,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
    ('ScaleFactor','TEAM','Nominal',3.29,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
    ('ScaleFactor','TEAM','Alto',2.19,'Coesão da Equipe','Quão bem a equipe trabalha junta.'),
    ('ScaleFactor','TEAM','MuitoAlto',1.10,'Coesão da Equipe','Quão bem a equipe trabalha junta.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='ScaleFactor' AND Contexto='PMAT')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('ScaleFactor','PMAT','MuitoBaixo',7.80,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
    ('ScaleFactor','PMAT','Baixo',6.24,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
    ('ScaleFactor','PMAT','Nominal',4.68,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
    ('ScaleFactor','PMAT','Alto',3.12,'Maturidade do Processo','Nível de formalização de processos (CMMI).'),
    ('ScaleFactor','PMAT','MuitoAlto',1.56,'Maturidade do Processo','Nível de formalização de processos (CMMI).');
END;

-- EFFORT MULTIPLIERS (EM)
IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='RCPX')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','RCPX','MuitoBaixo',0.49,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
    ('EffortMultiplier','RCPX','Baixo',0.60,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
    ('EffortMultiplier','RCPX','Nominal',1.00,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
    ('EffortMultiplier','RCPX','Alto',1.33,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.'),
    ('EffortMultiplier','RCPX','MuitoAlto',1.91,'Complexidade do Produto','Algoritmos, interações, funcionalidades críticas.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='RUSE')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','RUSE','MuitoBaixo',0.91,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
    ('EffortMultiplier','RUSE','Baixo',0.95,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
    ('EffortMultiplier','RUSE','Nominal',1.00,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
    ('EffortMultiplier','RUSE','Alto',1.07,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.'),
    ('EffortMultiplier','RUSE','MuitoAlto',1.15,'Reusabilidade Requerida','O quanto o código precisa ser reutilizável.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='PDIF')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','PDIF','MuitoBaixo',0.87,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
    ('EffortMultiplier','PDIF','Baixo',1.00,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
    ('EffortMultiplier','PDIF','Nominal',1.29,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
    ('EffortMultiplier','PDIF','Alto',1.81,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.'),
    ('EffortMultiplier','PDIF','MuitoAlto',2.61,'Dificuldade da Plataforma','Restrições de SO, hardware, comunicação, etc.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='PERS')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','PERS','MuitoBaixo',1.62,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
    ('EffortMultiplier','PERS','Baixo',1.26,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
    ('EffortMultiplier','PERS','Nominal',1.00,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
    ('EffortMultiplier','PERS','Alto',0.83,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.'),
    ('EffortMultiplier','PERS','MuitoAlto',0.63,'Capacidade da Equipe','Qualidade técnica dos desenvolvedores e analistas.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='PREX')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','PREX','MuitoBaixo',1.59,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
    ('EffortMultiplier','PREX','Baixo',1.33,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
    ('EffortMultiplier','PREX','Nominal',1.00,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
    ('EffortMultiplier','PREX','Alto',0.87,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.'),
    ('EffortMultiplier','PREX','MuitoAlto',0.74,'Experiência da Equipe','Experiência com o domínio, tecnologia, ferramentas.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='FCIL')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','FCIL','MuitoBaixo',1.43,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
    ('EffortMultiplier','FCIL','Baixo',1.30,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
    ('EffortMultiplier','FCIL','Nominal',1.00,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
    ('EffortMultiplier','FCIL','Alto',0.87,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.'),
    ('EffortMultiplier','FCIL','MuitoAlto',0.73,'Apoio de Ferramentas','Ferramentas CASE, automações, frameworks.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FatoresConversao WHERE TipoEntrada='EffortMultiplier' AND Contexto='SCED')
BEGIN
    INSERT INTO dbo.FatoresConversao (TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao) VALUES
    ('EffortMultiplier','SCED','MuitoBaixo',1.43,'Pressão de Cronograma','Se o cronograma está apertado ou relaxado.'),
    ('EffortMultiplier','SCED','Baixo',1.14,'Pressão de Cronograma','Se o cronograma está apertado ou relaxado.'),
    ('EffortMultiplier','SCED','Nominal',1.00,'Pressão de Cronograma','Se o cronograma está apertado ou relaxado.'),
    ('EffortMultiplier','SCED','Alto',1.00,'Pressão de Cronograma','Se o cronograma está apertado ou relaxado.'),
    ('EffortMultiplier','SCED','MuitoAlto',1.00,'Pressão de Cronograma','Se o cronograma está apertado ou relaxado.');
END;

COMMIT TRAN;

PRINT 'SCHEMA + SEED concluídos.';
