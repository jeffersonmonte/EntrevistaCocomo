namespace Entrevistas.Domain.Entities;
public class FatoresConversao
{
    public int Id { get; set; }
    public string TipoEntrada { get; set; } = null!; // ScaleFactor ou EffortMultiplier
    public string Contexto { get; set; } = null!;    // Ex: PREC, RUSE, etc.
    public string Nivel { get; set; } = null!;
    public double FatorConversao { get; set; } 

    public string? NomeCompleto { get; set; }        // Novo campo
    public string? Descricao { get; set; }           // Novo campo
}
