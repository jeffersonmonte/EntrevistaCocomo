using System;
using System.Collections.Generic;

namespace Entrevistas.Application.DTOs
{
    public class EntrevistaDetailDto
    {
        public Guid Id { get; set; }
        public string NomeEntrevista { get; set; } = null!;
        public DateTime DataEntrevista { get; set; }
        public int TipoEntrada { get; set; }
        public string? Linguagem { get; set; }

        public decimal TamanhoKloc { get; set; }
        public decimal SomaScaleFactors { get; set; }
        public decimal ProdutoEffortMultipliers { get; set; }
        public decimal EsforcoPM { get; set; }
        public decimal PrazoMeses { get; set; }
        public int TotalCFP { get; set; }

        public IList<ScaleFactorDto> ScaleFactors { get; set; } = new List<ScaleFactorDto>();
        public IList<EffortMultiplierDto> EffortMultipliers { get; set; } = new List<EffortMultiplierDto>();
        public IList<FuncInlineDto> Funcionalidades { get; set; } = new List<FuncInlineDto>();
    }
}
