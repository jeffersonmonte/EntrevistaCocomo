using Entrevistas.Domain.Enums;

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
