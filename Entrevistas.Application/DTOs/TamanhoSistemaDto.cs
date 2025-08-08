using Entrevistas.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Application.DTOs
{
    public class TamanhoSistemaDto
    {
        public TipoEntradaTamanho TipoEntrada { get; set; }

        // Para KLOC
        public decimal? ValorKLOC { get; set; }

        // Para FP
        public int? PontosDeFuncao { get; set; }
        public string? Linguagem { get; set; }

        // Para COSMIC
        public int? Entradas { get; set; }
        public int? Saidas { get; set; }
        public int? Leitura { get; set; }
        public int? Gravacao { get; set; }
    }
}
