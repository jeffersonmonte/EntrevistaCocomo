using Entrevistas.Domain.Enums;

namespace Entrevistas.Domain.Entities
{
    public class TamanhoSistema
    {
        public Guid Id { get; set; }

        public TipoEntradaTamanho TipoEntrada { get; set; }

        // Dados para KLOC direto
        public decimal? ValorKLOC { get; set; }

        // Dados para FP
        public int? PontosDeFuncao { get; set; }
        public string? Linguagem { get; set; }  // ex: Java, C#, etc.

        // Dados para COSMIC
        public int? Entradas { get; set; }
        public int? Saidas { get; set; }
        public int? Leitura { get; set; }
        public int? Gravacao { get; set; }

        // Calculado após conversão
        public decimal KlocConvertido { get; set; }
    }
}
