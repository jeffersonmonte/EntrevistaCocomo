/* ===========================================================
   DB Setup - Entrevistas + COCOMO II Early Design + COSMIC
   SQL Server / dbo
   =========================================================== */

SET NOCOUNT ON;
BEGIN TRY
BEGIN TRAN;

------------------------------------------------------------
-- Tabelas
------------------------------------------------------------

IF OBJECT_ID('dbo.MedicoesCosmic','U') IS NOT NULL DROP TABLE dbo.MedicoesCosmic;
IF OBJECT_ID('dbo.Funcionalidades','U') IS NOT NULL DROP TABLE dbo.Funcionalidades;
IF OBJECT_ID('dbo.Entrevistas','U') IS NOT NULL DROP TABLE dbo.Entrevistas;
IF OBJECT_ID('dbo.ConversoesTamanho','U') IS NOT NULL DROP TABLE dbo.ConversoesTamanho;
IF OBJECT_ID('dbo.FatoresConversao','U') IS NOT NULL DROP TABLE dbo.FatoresConversao;
IF OBJECT_ID('dbo.ParametrosCocomo','U') IS NOT NULL DROP TABLE dbo.ParametrosCocomo;

-- Entrevistas (dados principais + resultados)
CREATE TABLE dbo.Entrevistas
(
    Id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Entrevistas PRIMARY KEY DEFAULT NEWID(),
    NomeEntrevistado     NVARCHAR(200)    NOT NULL,
    NomeEntrevistador    NVARCHAR(200)    NULL,
    DataEntrevista       DATETIME2(0)     NOT NULL,

    -- Informação geral / entradas
    Linguagem            NVARCHAR(100)    NULL,
    TipoEntrada          INT              NOT NULL DEFAULT (1), -- 1=KLOC, 2=PF
    ValorKloc            DECIMAL(18,3)    NULL,
    PontosDeFuncao       DECIMAL(18,2)    NULL,
    Entradas             INT              NULL,
    Saidas               INT              NULL,
    Leitura              INT              NULL,
    Gravacao             INT              NULL,

    -- Resultados e apoio ao cálculo
    TotalCFP             INT              NULL,
    TamanhoKloc          DECIMAL(18,3)    NULL,
    SomaScaleFactors     DECIMAL(18,2)    NULL,
    ProdutoEffortMultipliers DECIMAL(18,4) NULL,
    EsforcoPM            DECIMAL(18,2)    NULL,
    PrazoMeses           DECIMAL(18,2)    NULL,

    CriadoEm             DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME()
);

-- Funcionalidades (para COSMIC)
CREATE TABLE dbo.Funcionalidades
(
    Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Funcionalidades PRIMARY KEY DEFAULT NEWID(),
    EntrevistaId     UNIQUEIDENTIFIER NOT NULL,
    Nome             NVARCHAR(200)    NOT NULL,
    Template         NVARCHAR(50)     NULL,  -- Consulta, Inclusao, Alteracao, Exclusao...
    Observacoes      NVARCHAR(500)    NULL,
    CriadoEm         DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Funcionalidades_Entrevistas
        FOREIGN KEY (EntrevistaId) REFERENCES dbo.Entrevistas(Id) ON DELETE CASCADE
);

-- Medições COSMIC por funcionalidade
CREATE TABLE dbo.MedicoesCosmic
(
    Id                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_MedicoesCosmic PRIMARY KEY DEFAULT NEWID(),
    FuncionalidadeId   UNIQUEIDENTIFIER NOT NULL,
    EntryE             INT NOT NULL DEFAULT(0),
    ExitX              INT NOT NULL DEFAULT(0),
    ReadR              INT NOT NULL DEFAULT(0),
    WriteW             INT NOT NULL DEFAULT(0),

    CONSTRAINT FK_MedicoesCosmic_Funcionalidades
        FOREIGN KEY (FuncionalidadeId) REFERENCES dbo.Funcionalidades(Id) ON DELETE CASCADE
);

-- Conversões de tamanho (PF/COSMIC => KLOC) por linguagem/geral
CREATE TABLE dbo.ConversoesTamanho
(
    Id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ConversoesTamanho PRIMARY KEY,
    TipoEntrada    NVARCHAR(20)  NOT NULL,    -- 'COSMIC' | 'PF'
    Contexto       NVARCHAR(100) NULL,        -- linguagem (ex.: 'C#') ou 'Padrão'
    FatorConversao DECIMAL(18,6) NOT NULL,    -- CFP/KLOC (COSMIC) ou PF/KLOC (PF)
    Observacao     NVARCHAR(200) NULL,

    CONSTRAINT UQ_ConversoesTamanho UNIQUE (TipoEntrada, Contexto)
);

-- Fatores de conversão (COCOMO II): ScaleFactors (SF) e EffortMultipliers (EM)
CREATE TABLE dbo.FatoresConversao
(
    Id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FatoresConversao PRIMARY KEY,
    TipoEntrada     NVARCHAR(30)  NOT NULL,   -- 'ScaleFactor' | 'EffortMultiplier'
    Contexto        NVARCHAR(30)  NOT NULL,   -- ex.: 'PREC', 'FLEX', ... | 'RCPX', 'RUSE', ...
    Nivel           NVARCHAR(30)  NOT NULL,   -- 'MuitoBaixo','Baixo','Nominal','Alto','MuitoAlto','ExtraAlto'
    FatorConversao  DECIMAL(18,4) NOT NULL,   -- SF: valor para somatório ; EM: multiplicador
    NomeCompleto    NVARCHAR(150) NOT NULL,
    Descricao       NVARCHAR(400) NULL,

    CONSTRAINT UQ_FatoresConversao UNIQUE (TipoEntrada, Contexto, Nivel)
);

-- Parâmetros COCOMO II (Early Design)
CREATE TABLE dbo.ParametrosCocomo
(
    Id     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ParametrosCocomo PRIMARY KEY,
    Modelo NVARCHAR(50) NOT NULL,   -- 'EarlyDesign'
    A      DECIMAL(18,4) NOT NULL,  -- esforço: PM = A * (Size)^B * ΠEM
    B      DECIMAL(18,4) NOT NULL,  -- escala (B = 0.91 + 0.01 * ΣSF/5) – depende da fórmula adotada
    C      DECIMAL(18,4) NOT NULL,  -- cronograma: TDEV = C * (PM)^D
    D      DECIMAL(18,4) NOT NULL
);

------------------------------------------------------------
-- Seeds mínimos
------------------------------------------------------------

-- Conversões (ajuste conforme sua realidade)
MERGE dbo.ConversoesTamanho AS tgt
USING (VALUES
    (N'COSMIC', N'Padrão', 105.000000, N'CFP por KLOC - padrão'),
    (N'PF',     N'Padrão', 110.000000, N'PF por KLOC - padrão (ajuste se necessário)')
) AS src(TipoEntrada, Contexto, FatorConversao, Observacao)
ON (tgt.TipoEntrada = src.TipoEntrada AND ISNULL(tgt.Contexto, N'Padrão') = src.Contexto)
WHEN NOT MATCHED THEN
    INSERT (TipoEntrada, Contexto, FatorConversao, Observacao) VALUES (src.TipoEntrada, src.Contexto, src.FatorConversao, src.Observacao)
WHEN MATCHED THEN
    UPDATE SET FatorConversao = src.FatorConversao, Observacao = src.Observacao;

-- Parâmetros COCOMO II (Early Design)
IF NOT EXISTS (SELECT 1 FROM dbo.ParametrosCocomo WHERE Modelo = N'EarlyDesign')
BEGIN
    INSERT INTO dbo.ParametrosCocomo (Modelo, A, B, C, D)
    VALUES (N'EarlyDesign', 2.94, 0.91, 3.67, 0.28);
END

------------------------------------------------------------
-- FATORES COCOMO II - Early Design
-- Níveis usados: MuitoBaixo, Baixo, Nominal, Alto, MuitoAlto, ExtraAlto
------------------------------------------------------------

-- ============ SCALE FACTORS (SF) ============
-- Tabela clássica (valores somados para compor a escala)
-- PREC (Precedência do Projeto)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'ScaleFactor', N'PREC', N'MuitoBaixo', 6.20, N'Precedência do Projeto', N'Grau de similaridade com projetos anteriores.'),
 (N'ScaleFactor', N'PREC', N'Baixo',      4.96, N'Precedência do Projeto', N''),
 (N'ScaleFactor', N'PREC', N'Nominal',    3.72, N'Precedência do Projeto', N''),
 (N'ScaleFactor', N'PREC', N'Alto',       2.48, N'Precedência do Projeto', N''),
 (N'ScaleFactor', N'PREC', N'MuitoAlto',  1.24, N'Precedência do Projeto', N''),
 (N'ScaleFactor', N'PREC', N'ExtraAlto',  0.00, N'Precedência do Projeto', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- FLEX (Flexibilidade de Processo)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'ScaleFactor', N'FLEX', N'MuitoBaixo', 5.07, N'Flexibilidade de Processo', N'Grau de rigidez vs. liberdade do processo.'),
 (N'ScaleFactor', N'FLEX', N'Baixo',      4.05, N'Flexibilidade de Processo', N''),
 (N'ScaleFactor', N'FLEX', N'Nominal',    3.04, N'Flexibilidade de Processo', N''),
 (N'ScaleFactor', N'FLEX', N'Alto',       2.03, N'Flexibilidade de Processo', N''),
 (N'ScaleFactor', N'FLEX', N'MuitoAlto',  1.01, N'Flexibilidade de Processo', N''),
 (N'ScaleFactor', N'FLEX', N'ExtraAlto',  0.00, N'Flexibilidade de Processo', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- RESL (Resolução de Riscos)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'ScaleFactor', N'RESL', N'MuitoBaixo', 7.07, N'Resolução de Riscos', N'Capacidade de identificar/mitigar riscos.'),
 (N'ScaleFactor', N'RESL', N'Baixo',      5.65, N'Resolução de Riscos', N''),
 (N'ScaleFactor', N'RESL', N'Nominal',    4.24, N'Resolução de Riscos', N''),
 (N'ScaleFactor', N'RESL', N'Alto',       2.83, N'Resolução de Riscos', N''),
 (N'ScaleFactor', N'RESL', N'MuitoAlto',  1.41, N'Resolução de Riscos', N''),
 (N'ScaleFactor', N'RESL', N'ExtraAlto',  0.00, N'Resolução de Riscos', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- TEAM (Coesão da Equipe)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'ScaleFactor', N'TEAM', N'MuitoBaixo', 5.48, N'Coesão da Equipe', N'Histórico de trabalho conjunto, alinhamento e comunicação.'),
 (N'ScaleFactor', N'TEAM', N'Baixo',      4.38, N'Coesão da Equipe', N''),
 (N'ScaleFactor', N'TEAM', N'Nominal',    3.29, N'Coesão da Equipe', N''),
 (N'ScaleFactor', N'TEAM', N'Alto',       2.19, N'Coesão da Equipe', N''),
 (N'ScaleFactor', N'TEAM', N'MuitoAlto',  1.10, N'Coesão da Equipe', N''),
 (N'ScaleFactor', N'TEAM', N'ExtraAlto',  0.00, N'Coesão da Equipe', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- PMAT (Maturidade do Processo)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'ScaleFactor', N'PMAT', N'MuitoBaixo', 7.80, N'Maturidade do Processo', N'Nível de maturidade (procedimentos, melhoria contínua, aderência).'),
 (N'ScaleFactor', N'PMAT', N'Baixo',      6.24, N'Maturidade do Processo', N''),
 (N'ScaleFactor', N'PMAT', N'Nominal',    4.68, N'Maturidade do Processo', N''),
 (N'ScaleFactor', N'PMAT', N'Alto',       3.12, N'Maturidade do Processo', N''),
 (N'ScaleFactor', N'PMAT', N'MuitoAlto',  1.56, N'Maturidade do Processo', N''),
 (N'ScaleFactor', N'PMAT', N'ExtraAlto',  0.00, N'Maturidade do Processo', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- ============ EFFORT MULTIPLIERS (EM) ============
-- Tabela Early Design típica (ajuste se sua referência oficial diferir)

-- RCPX (Complexidade do Produto)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'RCPX', N'MuitoBaixo', 0.49, N'Complexidade do Produto', N'Requisitos de confiabilidade/complexidade.'),
 (N'EffortMultiplier', N'RCPX', N'Baixo',      0.60, N'Complexidade do Produto', N''),
 (N'EffortMultiplier', N'RCPX', N'Nominal',    0.83, N'Complexidade do Produto', N''),
 (N'EffortMultiplier', N'RCPX', N'Alto',       1.00, N'Complexidade do Produto', N''),
 (N'EffortMultiplier', N'RCPX', N'MuitoAlto',  1.33, N'Complexidade do Produto', N''),
 (N'EffortMultiplier', N'RCPX', N'ExtraAlto',  1.91, N'Complexidade do Produto', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- RUSE (Reusabilidade Requerida)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'RUSE', N'MuitoBaixo', 0.95, N'Reusabilidade Requerida', N''),
 (N'EffortMultiplier', N'RUSE', N'Baixo',      1.00, N'Reusabilidade Requerida', N''),
 (N'EffortMultiplier', N'RUSE', N'Nominal',    1.07, N'Reusabilidade Requerida', N''),
 (N'EffortMultiplier', N'RUSE', N'Alto',       1.15, N'Reusabilidade Requerida', N''),
 (N'EffortMultiplier', N'RUSE', N'MuitoAlto',  1.24, N'Reusabilidade Requerida', N''),
 (N'EffortMultiplier', N'RUSE', N'ExtraAlto',  1.44, N'Reusabilidade Requerida', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- PDIF (Dificuldade da Plataforma)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'PDIF', N'MuitoBaixo', 0.87, N'Dificuldade da Plataforma', N'Plataforma/ambiente restritivo.'),
 (N'EffortMultiplier', N'PDIF', N'Baixo',      1.00, N'Dificuldade da Plataforma', N''),
 (N'EffortMultiplier', N'PDIF', N'Nominal',    1.29, N'Dificuldade da Plataforma', N''),
 (N'EffortMultiplier', N'PDIF', N'Alto',       1.81, N'Dificuldade da Plataforma', N''),
 (N'EffortMultiplier', N'PDIF', N'MuitoAlto',  2.61, N'Dificuldade da Plataforma', N''),
 (N'EffortMultiplier', N'PDIF', N'ExtraAlto',  3.68, N'Dificuldade da Plataforma', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- PERS (Capacidade da Equipe)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'PERS', N'MuitoBaixo', 2.12, N'Capacidade da Equipe', N'Capacidade individual geral.'),
 (N'EffortMultiplier', N'PERS', N'Baixo',      1.62, N'Capacidade da Equipe', N''),
 (N'EffortMultiplier', N'PERS', N'Nominal',    1.26, N'Capacidade da Equipe', N''),
 (N'EffortMultiplier', N'PERS', N'Alto',       1.00, N'Capacidade da Equipe', N''),
 (N'EffortMultiplier', N'PERS', N'MuitoAlto',  0.83, N'Capacidade da Equipe', N''),
 (N'EffortMultiplier', N'PERS', N'ExtraAlto',  0.63, N'Capacidade da Equipe', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- PREX (Experiência da Equipe)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'PREX', N'MuitoBaixo', 1.59, N'Experiência da Equipe', N'Experiência prévia no domínio/tecnologia/processo.'),
 (N'EffortMultiplier', N'PREX', N'Baixo',      1.33, N'Experiência da Equipe', N''),
 (N'EffortMultiplier', N'PREX', N'Nominal',    1.22, N'Experiência da Equipe', N''),
 (N'EffortMultiplier', N'PREX', N'Alto',       1.00, N'Experiência da Equipe', N''),
 (N'EffortMultiplier', N'PREX', N'MuitoAlto',  0.87, N'Experiência da Equipe', N''),
 (N'EffortMultiplier', N'PREX', N'ExtraAlto',  0.74, N'Experiência da Equipe', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- FCIL (Ferramentas/Infraestrutura)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'FCIL', N'MuitoBaixo', 1.43, N'Apoio de Ferramentas', N'Ferramentas CASE, devops, automação, infra.'),
 (N'EffortMultiplier', N'FCIL', N'Baixo',      1.30, N'Apoio de Ferramentas', N''),
 (N'EffortMultiplier', N'FCIL', N'Nominal',    1.10, N'Apoio de Ferramentas', N''),
 (N'EffortMultiplier', N'FCIL', N'Alto',       1.00, N'Apoio de Ferramentas', N''),
 (N'EffortMultiplier', N'FCIL', N'MuitoAlto',  0.87, N'Apoio de Ferramentas', N''),
 (N'EffortMultiplier', N'FCIL', N'ExtraAlto',  0.73, N'Apoio de Ferramentas', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

-- SCED (Pressão de Cronograma)
MERGE dbo.FatoresConversao AS tgt
USING (VALUES
 (N'EffortMultiplier', N'SCED', N'MuitoBaixo', 1.43, N'Pressão de Cronograma', N'Redução agressiva do prazo.'),
 (N'EffortMultiplier', N'SCED', N'Baixo',      1.14, N'Pressão de Cronograma', N''),
 (N'EffortMultiplier', N'SCED', N'Nominal',    1.00, N'Pressão de Cronograma', N''),
 (N'EffortMultiplier', N'SCED', N'Alto',       1.00, N'Pressão de Cronograma', N''),
 (N'EffortMultiplier', N'SCED', N'MuitoAlto',  1.00, N'Pressão de Cronograma', N''),
 (N'EffortMultiplier', N'SCED', N'ExtraAlto',  1.00, N'Pressão de Cronograma', N'')
) AS src(TipoEntrada, Contexto, Nivel, FatorConversao, NomeCompleto, Descricao)
ON (tgt.TipoEntrada=src.TipoEntrada AND tgt.Contexto=src.Contexto AND tgt.Nivel=src.Nivel)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada,Contexto,Nivel,FatorConversao,NomeCompleto,Descricao)
  VALUES (src.TipoEntrada,src.Contexto,src.Nivel,src.FatorConversao,src.NomeCompleto,src.Descricao);

------------------------------------------------------------
COMMIT;
PRINT 'Setup concluído com sucesso.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;


/* ===========================================================
   ConversoesTamanho - Seeds (COSMIC + PF por linguagem)
   Interpretação:
     - TipoEntrada='COSMIC' -> FatorConversao = CFP por KLOC
     - TipoEntrada='PF'     -> FatorConversao = PF  por KLOC
   Fórmulas:
     - KLOC (via COSMIC) = CFP / (CFP/KLOC)
     - KLOC (via PF)     = PF  / (PF/KLOC)
   =========================================================== */

SET NOCOUNT ON;

------------------------------------------------------------
-- COSMIC (padrão)
------------------------------------------------------------
MERGE dbo.ConversoesTamanho AS tgt
USING (VALUES
  (N'COSMIC', N'Padrão', 105.000000, N'CFP por KLOC - baseline COSMIC')
) AS src (TipoEntrada, Contexto, FatorConversao, Observacao)
ON (tgt.TipoEntrada = src.TipoEntrada AND ISNULL(tgt.Contexto, N'Padrão') = src.Contexto)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada, Contexto, FatorConversao, Observacao)
  VALUES (src.TipoEntrada, src.Contexto, src.FatorConversao, src.Observacao)
WHEN MATCHED THEN
  UPDATE SET FatorConversao = src.FatorConversao, Observacao = src.Observacao;

------------------------------------------------------------
-- PF por linguagem (PF/KLOC = 1000 / SLOC_por_PF)
-- Entre parênteses na observação: SLOC/FP de referência (aprox.)
------------------------------------------------------------
MERGE dbo.ConversoesTamanho AS tgt
USING (VALUES
    (N'PF', N'Assembly',     3.125000,  N'PF por KLOC - base COCOMO (aprox), 320 SLOC/FP'),
    (N'PF', N'C',            7.812500,  N'PF por KLOC - base COCOMO (aprox), 128 SLOC/FP'),
    (N'PF', N'COBOL',       12.500000,  N'PF por KLOC - base COCOMO (aprox),  80 SLOC/FP'),
    (N'PF', N'Fortran',      9.523800,  N'PF por KLOC - base COCOMO (aprox), 105 SLOC/FP'),
    (N'PF', N'Pascal',      11.111100,  N'PF por KLOC - base COCOMO (aprox),  90 SLOC/FP'),
    (N'PF', N'Ada95',       14.285700,  N'PF por KLOC - base COCOMO (aprox),  70 SLOC/FP'),
    (N'PF', N'C++',         18.867900,  N'PF por KLOC - base COCOMO (aprox),  53 SLOC/FP'),
    (N'PF', N'Java',        18.867900,  N'PF por KLOC - base COCOMO (aprox),  53 SLOC/FP'),
    (N'PF', N'C#',          18.518500,  N'PF por KLOC - base COCOMO (aprox),  54 SLOC/FP'),
    (N'PF', N'Visual Basic',20.000000,  N'PF por KLOC - base COCOMO (aprox),  50 SLOC/FP'),
    (N'PF', N'SQL',         83.333300,  N'PF por KLOC - base COCOMO (aprox),  12 SLOC/FP'),
    (N'PF', N'PL/SQL',      66.666700,  N'PF por KLOC - base COCOMO (aprox),  15 SLOC/FP'),
    (N'PF', N'Python',      47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'Ruby',        47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'Perl',        47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'PHP',         47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'JavaScript',  21.276600,  N'PF por KLOC - base COCOMO (aprox),  47 SLOC/FP'),
    (N'PF', N'TypeScript',  21.276600,  N'PF por KLOC - base COCOMO (aprox),  47 SLOC/FP'),
    (N'PF', N'Swift',       18.867900,  N'PF por KLOC - base COCOMO (aprox),  53 SLOC/FP'),
    (N'PF', N'Kotlin',      18.867900,  N'PF por KLOC - base COCOMO (aprox),  53 SLOC/FP'),
    (N'PF', N'Go',          18.181800,  N'PF por KLOC - base COCOMO (aprox),  55 SLOC/FP'),
    (N'PF', N'Scala',       18.867900,  N'PF por KLOC - base COCOMO (aprox),  53 SLOC/FP'),
    (N'PF', N'Objective-C', 12.500000,  N'PF por KLOC - base COCOMO (aprox),  80 SLOC/FP'),
    (N'PF', N'R',           47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'MATLAB',      47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'Dart',        18.181800,  N'PF por KLOC - base COCOMO (aprox),  55 SLOC/FP'),
    (N'PF', N'Rust',        18.518500,  N'PF por KLOC - base COCOMO (aprox),  54 SLOC/FP'),
    (N'PF', N'Haskell',     47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP'),
    (N'PF', N'Lua',         47.619000,  N'PF por KLOC - base COCOMO (aprox),  21 SLOC/FP')
) AS src (TipoEntrada, Contexto, FatorConversao, Observacao)
ON (tgt.TipoEntrada = src.TipoEntrada AND ISNULL(tgt.Contexto, N'Padrão') = src.Contexto)
WHEN NOT MATCHED THEN
  INSERT (TipoEntrada, Contexto, FatorConversao, Observacao)
  VALUES (src.TipoEntrada, src.Contexto, src.FatorConversao, src.Observacao)
WHEN MATCHED THEN
  UPDATE SET FatorConversao = src.FatorConversao, Observacao = src.Observacao;

PRINT 'ConversoesTamanho - seeds inseridos/atualizados.';
