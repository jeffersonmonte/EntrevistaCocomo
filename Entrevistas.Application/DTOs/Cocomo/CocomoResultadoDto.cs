namespace Entrevistas.Application.DTOs.Cocomo;

public sealed class CocomoResultadoDto
{
    public Guid EntrevistaId { get; set; }
    public int TotalCFP { get; set; }
    public decimal TamanhoKloc { get; set; }
    public decimal SomaScaleFactors { get; set; }
    public decimal ExpoenteE { get; set; }
    public decimal ProdutoEffortMultipliers { get; set; }
    public decimal EsforcoPM { get; set; }
    public decimal PrazoMeses { get; set; }
}
