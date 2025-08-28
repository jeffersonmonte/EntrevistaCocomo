using Entrevistas.Domain.Enums;

namespace Entrevistas.Application.DTOs
{
    public class EntrevistaOutputDto
    {
        public Guid Id { get; set; }
		public string NomeEntrevista { get; set; } = string.Empty;
        public DateTime DataEntrevista { get; set; }
        public string? Linguagem { get; set; }
        public decimal TamanhoKloc { get; set; }
        public decimal SomaScaleFactors { get; set; }
        public decimal ProdutoEffortMultipliers { get; set; }
        public decimal EsforcoPM { get; set; }
        public decimal PrazoMeses { get; set; }
        public int TotalCFP { get; set; }
        public TipoEntradaTamanho TipoEntrada { get; set; }
    }
}
