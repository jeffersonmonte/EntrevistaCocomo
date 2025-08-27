namespace Entrevistas.Domain.Entities
{
    public class Funcionalidade
    {
        public Guid Id { get; set; }
        public Guid EntrevistaId { get; set; }
        public string Nome { get; set; } = default!;
        public string? Template { get; set; } // Consulta | Inclusao | Alteracao | Exclusao
        public string? Observacoes { get; set; }

        public Entrevista Entrevista { get; set; } = default!;
        public MedicaoCosmic Medicao { get; set; } = default!;
    }
}
