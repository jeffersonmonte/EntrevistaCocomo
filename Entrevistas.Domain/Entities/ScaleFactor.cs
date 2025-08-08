namespace Entrevistas.Domain.Entities
{
    public class ScaleFactor
    {
        public Guid Id { get; set; }
        public Guid EntrevistaId { get; set; }
        public string Nome { get; set; } = string.Empty;  // Ex: PREC, FLEX, RESL...
        public string Nivel { get; set; } = string.Empty; // Ex: Very Low, High, etc.
        public decimal Valor { get; set; }

        public Entrevista Entrevista { get; set; } = null!;
    }
}
