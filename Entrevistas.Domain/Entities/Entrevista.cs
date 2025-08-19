using Entrevistas.Domain.Enums;

namespace Entrevistas.Domain.Entities
{
    public class Entrevista
    {
        public Guid Id { get; set; }
		public string NomeEntrevista { get; set; } = string.Empty;
		public string NomeEntrevistado { get; set; } = string.Empty;
        public string NomeEntrevistador { get; set; } = string.Empty;
        public DateTime DataEntrevista { get; set; }
        public TipoEntradaTamanho TipoEntrada { get; set; }
        public string? Linguagem { get; set; }
        public decimal TamanhoKloc { get; set; }
        public decimal SomaScaleFactors { get; set; }
        public decimal ProdutoEffortMultipliers { get; set; }
        public decimal EsforcoPM { get; set; }
        public decimal PrazoMeses { get; set; }
        public List<ScaleFactor> ScaleFactors { get; set; } = new();
        public List<EffortMultiplier> EffortMultipliers { get; set; } = new();
        public int TotalCFP { get; set; }
        public ICollection<Funcionalidade> Funcionalidades { get; set; } = new List<Funcionalidade>();
    }

}
