using System.ComponentModel.DataAnnotations;

namespace Entrevistas.Application.DTOs.Cocomo;

public sealed class CocomoSelecoesRequest
{
    [Required]
    public Guid EntrevistaId { get; set; }

    /// <summary>
    /// Mapa dos 5 Scale Factors (keys: PREC, FLEX, RESL, TEAM, PMAT) para um nível (ex.: "Nominal").
    /// Níveis válidos devem existir em FatoresConversao (TipoEntrada='ScaleFactor').
    /// </summary>
    [Required]
    public Dictionary<string, string> ScaleFactors { get; set; } = new();

    /// <summary>
    /// Mapa dos 7 Effort Multipliers (keys: RCPX, RUSE, PDIF, PERS, PREX, FCIL, SCED) para um nível.
    /// Níveis válidos devem existir em FatoresConversao (TipoEntrada='EffortMultiplier').
    /// </summary>
    [Required]
    public Dictionary<string, string> EffortMultipliers { get; set; } = new();
}
