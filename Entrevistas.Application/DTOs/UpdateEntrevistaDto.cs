using System;
using System.Collections.Generic;

namespace Entrevistas.Application.DTOs
{
    public class UpdateEntrevistaDto
    {
        public string NomeEntrevista { get; set; } = null!;
        public DateTime DataEntrevista { get; set; }

        /// <summary>0=COSMIC, 1=PF</summary>
        public int TipoEntrada { get; set; }
        public string? Linguagem { get; set; }

        public IList<ScaleFactorDto> ScaleFactors { get; set; } = new List<ScaleFactorDto>();
        public IList<EffortMultiplierDto> EffortMultipliers { get; set; } = new List<EffortMultiplierDto>();
        public IList<FuncInlineDto>? Funcionalidades { get; set; }
    }
}
