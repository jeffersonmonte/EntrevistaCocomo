namespace Entrevistas.Domain.Entities
{
    public class ItemEntrevista
    {
        public Guid Id { get; set; }
        public Guid EntrevistaId { get; set; }

        public string Pergunta { get; set; } = string.Empty;
        public string ParametroCocomo { get; set; } = string.Empty;
        public string Classificacao { get; set; } = string.Empty;
        public decimal ValorEMSF { get; set; }
        public string Observacoes { get; set; } = string.Empty;

        // Navegação
        public Entrevista Entrevista { get; set; }
    }
}
