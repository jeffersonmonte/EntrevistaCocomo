namespace Entrevistas.Application.DTOs.Funcionalidades;

public sealed class UpdateFuncionalidadeRequest
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = default!;
    public string? Template { get; set; }
    public string? Observacoes { get; set; }
}
