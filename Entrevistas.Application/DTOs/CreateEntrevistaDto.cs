using Entrevistas.Domain.Enums;

namespace Entrevistas.Application.DTOs
{
    public partial class CreateEntrevistaDto
    {
        public string NomeEntrevista { get; set; } = null!;
        public string NomeEntrevistado { get; set; } = null!;
        public string NomeEntrevistador { get; set; } = null!;
        public DateTime DataEntrevista { get; set; }

        public TipoEntradaTamanho TipoEntrada { get; set; }
        public string? Linguagem { get; set; } // "Geral" p/ COSMIC; linguagem p/ PF

        // Atalho COSMIC (totais na própria entrevista)
        public int Entradas { get; set; }   // E
        public int Saidas { get; set; }     // X
        public int Leitura { get; set; }    // R
        public int Gravacao { get; set; }   // W

        // Tabelas de fatores
        public IList<ScaleFactorDto> ScaleFactors { get; set; } = new List<ScaleFactorDto>();
        public IList<EffortMultiplierDto> EffortMultipliers { get; set; } = new List<EffortMultiplierDto>();

        // Opcional: funcionalidades detalhadas (se vier, tem prioridade para calcular TotalCFP)
        public IList<FuncInlineDto>? Funcionalidades { get; set; }
    }
}
