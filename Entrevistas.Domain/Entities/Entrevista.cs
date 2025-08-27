using Entrevistas.Domain.Enums;

namespace Entrevistas.Domain.Entities
{
    public class Entrevista
    {
        public Guid Id { get; set; }
        public string NomeEntrevista { get; set; } = null!;
        public string NomeEntrevistado { get; set; } = null!;
        public string NomeEntrevistador { get; set; } = null!;
        public DateTime DataEntrevista { get; set; }

        /// <summary>
        /// 0 = COSMIC (CFP), 1 = PF (Pontos de Função)
        /// </summary>
        public TipoEntradaTamanho TipoEntrada { get; set; }

        /// <summary>
        /// Linguagem/Contexto para conversão de PF->KLOC (ou "Geral" p/ COSMIC)
        /// </summary>
        public string? Linguagem { get; set; }

        public decimal TamanhoKloc { get; set; }
        public decimal SomaScaleFactors { get; set; }
        public decimal ProdutoEffortMultipliers { get; set; }
        public decimal EsforcoPM { get; set; }
        public decimal PrazoMeses { get; set; }
        public int TotalCFP { get; set; }

        public ICollection<ScaleFactor> ScaleFactors { get; set; } = new List<ScaleFactor>();
        public ICollection<EffortMultiplier> EffortMultipliers { get; set; } = new List<EffortMultiplier>();
        public ICollection<Funcionalidade> Funcionalidades { get; set; } = new List<Funcionalidade>();
    }
}
