namespace Entrevistas.Application.DTOs.Cocomo;

public sealed class CocomoSelecoesResponse
{
    public Guid EntrevistaId { get; set; }

    // Mapa "contexto" -> "nível", sempre com as 5 chaves de SF e 7 de EM
    public Dictionary<string, string> ScaleFactors { get; set; } = new();
    public Dictionary<string, string> EffortMultipliers { get; set; } = new();

    // Resultado consolidado (persistido)
    public int TotalCFP { get; set; }
    public decimal TamanhoKloc { get; set; }
    public decimal SomaScaleFactors { get; set; }
    public decimal ExpoenteE { get; set; }
    public decimal ProdutoEffortMultipliers { get; set; }
    public decimal EsforcoPM { get; set; }
    public decimal PrazoMeses { get; set; }
}
