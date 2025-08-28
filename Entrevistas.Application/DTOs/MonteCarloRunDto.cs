namespace Entrevistas.Application.DTOs
{
    public class MonteCarloRunDto
    {
        public Guid Id { get; set; }
        public Guid EntrevistaId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsAtual { get; set; }

        public int Iterations { get; set; }
        public decimal? KlocMin { get; set; }
        public decimal? KlocMode { get; set; }
        public decimal? KlocMax { get; set; }

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
    }
}
