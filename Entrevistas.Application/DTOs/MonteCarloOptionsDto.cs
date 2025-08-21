
namespace Entrevistas.Application.DTOs
{
    public class MonteCarloOptionsDto
    {
        public bool Enabled { get; set; } = true;
        public int Iterations { get; set; } = 10000;

        // Opcional: triangular para KLOC; se não informado, usa [0.9 * KLOC, KLOC, 1.2 * KLOC]
        public decimal? KlocMin { get; set; }
        public decimal? KlocMode { get; set; }
        public decimal? KlocMax { get; set; }
    }

    public class MonteCarloSummaryDto
    {
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
