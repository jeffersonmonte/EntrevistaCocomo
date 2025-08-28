-- Criar tabela MonteCarloResultados
IF OBJECT_ID(N'[dbo].[MonteCarloResultados]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[MonteCarloResultados]
    (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_MCR_Id] DEFAULT NEWID(),
        [EntrevistaId] UNIQUEIDENTIFIER NOT NULL,

        -- Opções usadas
        [Iterations] INT NOT NULL,
        [KlocMin] DECIMAL(18,4) NULL,
        [KlocMode] DECIMAL(18,4) NULL,
        [KlocMax] DECIMAL(18,4) NULL,

        -- Parâmetros COCOMO na fotografia da execução
        [A] DECIMAL(18,6) NOT NULL,
        [B] DECIMAL(18,6) NOT NULL,
        [C] DECIMAL(18,6) NOT NULL,
        [D] DECIMAL(18,6) NOT NULL,
        [SomaScaleFactors] DECIMAL(18,6) NOT NULL,
        [ProdutoEffortMultipliers] DECIMAL(18,6) NOT NULL,
        [TamanhoKloc] DECIMAL(18,6) NOT NULL,

        -- Resultados (PM)
        [P10_PM]   DECIMAL(18,6) NOT NULL,
        [P50_PM]   DECIMAL(18,6) NOT NULL,
        [P90_PM]   DECIMAL(18,6) NOT NULL,
        [Media_PM] DECIMAL(18,6) NOT NULL,
        [Desvio_PM] DECIMAL(18,6) NOT NULL,

        -- Resultados (TDEV)
        [P10_TDEV]   DECIMAL(18,6) NOT NULL,
        [P50_TDEV]   DECIMAL(18,6) NOT NULL,
        [P90_TDEV]   DECIMAL(18,6) NOT NULL,
        [Media_TDEV] DECIMAL(18,6) NOT NULL,
        [Desvio_TDEV] DECIMAL(18,6) NOT NULL,

        [CreatedAt] DATETIME2(3) NOT NULL CONSTRAINT [DF_MCR_CreatedAt] DEFAULT SYSUTCDATETIME(),
        [IsAtual] BIT NOT NULL CONSTRAINT [DF_MCR_IsAtual] DEFAULT (0),

        CONSTRAINT [PK_MonteCarloResultados] PRIMARY KEY NONCLUSTERED ([Id] ASC)
    );

    -- Índice clusterizado por EntrevistaId + CreatedAt (consulta por histórico/últimos)
    CREATE CLUSTERED INDEX [CX_MCR_EntrevistaId_CreatedAt]
        ON [dbo].[MonteCarloResultados] ([EntrevistaId] ASC, [CreatedAt] DESC);

    -- Índice para priorizar buscas pelo “Atual”
    CREATE NONCLUSTERED INDEX [IX_MCR_EntrevistaId_IsAtual]
        ON [dbo].[MonteCarloResultados] ([EntrevistaId] ASC, [IsAtual] DESC);
END
GO

-- Chave estrangeira (ajuste o nome/esquema da tabela de Entrevistas se necessário)
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_MCR_Entrevistas'
)
BEGIN
    ALTER TABLE [dbo].[MonteCarloResultados]
    ADD CONSTRAINT [FK_MCR_Entrevistas]
        FOREIGN KEY ([EntrevistaId])
        REFERENCES [dbo].[Entrevistas] ([Id])
        ON DELETE CASCADE;
END
GO
