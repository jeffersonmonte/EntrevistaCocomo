namespace Entrevistas.Application.DTOs
{
    public record NovaFuncDto(string Nome, string? Template, string? Observacoes, MedicaoDto Medicao);
}
