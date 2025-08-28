using Entrevistas.Domain.Enums;

namespace Entrevistas.Application.DTOs.Entrevistas;

public partial class UpdateEntrevistaRequest
{
    public Guid Id { get; set; }
    public string NomeEntrevista { get; set; } = null!;
    public DateTime DataEntrevista { get; set; }
    public TipoEntradaTamanho TipoEntrada { get; set; }
    public string? Linguagem { get; set; }

    // Recalibragem direta COSMIC
    public int Entradas { get; set; }
    public int Saidas { get; set; }
    public int Leitura { get; set; }
    public int Gravacao { get; set; }

    public IList<ScaleFactorDto> ScaleFactors { get; set; } = new List<ScaleFactorDto>();
    public IList<EffortMultiplierDto> EffortMultipliers { get; set; } = new List<EffortMultiplierDto>();
    public IList<FuncInlineDto>? Funcionalidades { get; set; }
}
