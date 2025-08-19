using Entrevistas.Domain.Enums;

namespace Entrevistas.Application.DTOs
{
    public class EntrevistaInputDto
    {
		public string NomeEntrevista { get; set; } = string.Empty;
		public string NomeEntrevistado { get; set; } = string.Empty;
        public string NomeEntrevistador { get; set; } = string.Empty;
        public DateTime DataEntrevista { get; set; } = DateTime.UtcNow;

        public TipoEntradaTamanho TipoEntrada { get; set; }

        public decimal? ValorKloc { get; set; }
        public int? PontosDeFuncao { get; set; }
        public string? Linguagem { get; set; }
        public int? Entradas { get; set; }
        public int? Saidas { get; set; }
        public int? Leitura { get; set; }
        public int? Gravacao { get; set; }

        public List<ScaleFactorDto> ScaleFactors { get; set; } = new();
        public List<EffortMultiplierDto> EffortMultipliers { get; set; } = new();
    }
}
