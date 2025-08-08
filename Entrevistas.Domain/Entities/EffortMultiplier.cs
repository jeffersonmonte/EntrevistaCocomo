namespace Entrevistas.Domain.Entities
{
    public class EffortMultiplier
    {
        public Guid Id { get; set; }
        public Guid EntrevistaId { get; set; }
        public string Nome { get; set; } = string.Empty;  // Ex: RUSE, TIME, PCAP...
        public string Nivel { get; set; } = string.Empty;
        public decimal Valor { get; set; }

        public Entrevista Entrevista { get; set; } = null!;
    }
}
