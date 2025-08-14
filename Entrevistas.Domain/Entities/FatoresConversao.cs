namespace Entrevistas.Domain.Entities;
public class FatoresConversao
{
    public int Id { get; set; }
    public string TipoEntrada { get; set; } = null!; // ScaleFactor ou EffortMultiplier
    public string Contexto { get; set; } = null!;    // Ex: PREC, RUSE, etc.
    public string Nivel { get; set; } = null!;
    public decimal FatorConversao { get; set; } 

    public string? NomeCompleto { get; set; }
    public string? Descricao { get; set; }
}
