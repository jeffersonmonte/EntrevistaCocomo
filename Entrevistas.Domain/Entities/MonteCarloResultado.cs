namespace Entrevistas.Domain.Entities
{
    public class MonteCarloResultado
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // FK
        public Guid EntrevistaId { get; set; }
        public Entrevista Entrevista { get; set; } = null!;

        // Opções usadas
        public int Iterations { get; set; }
        public decimal? KlocMin { get; set; }
        public decimal? KlocMode { get; set; }
        public decimal? KlocMax { get; set; }

        // Parâmetros Cocomo efetivos no momento (fotografia)
        public decimal A { get; set; }
        public decimal B { get; set; }
        public decimal C { get; set; }
        public decimal D { get; set; }
        public decimal SomaScaleFactors { get; set; }
        public decimal ProdutoEffortMultipliers { get; set; }
        public decimal TamanhoKloc { get; set; }

        // Resultados (PM e TDEV)
        public decimal P10_PM { get; set; }
        public decimal P50_PM { get; set; }
        public decimal P90_PM { get; set; }
        public decimal Media_PM { get; set; }
        public decimal Desvio_PM { get; set; }

        public decimal P10_TDEV { get; set; }
        public decimal P50_TDEV { get; set; }
        public decimal P90_TDEV { get; set; }
        public decimal Media_TDEV { get; set; }
        public decimal Desvio_TDEV { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Controle de “modo edição”: se true, representa o resultado “oficial” atual da entrevista
        public bool IsAtual { get; set; }
    }
}
