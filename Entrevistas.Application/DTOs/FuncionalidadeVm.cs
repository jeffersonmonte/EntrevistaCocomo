namespace Entrevistas.Application.DTOs
{
    public record FuncionalidadeVm(
        Guid Id,
        string Nome,
        string? Template,
        string? Observacoes,
        int E,
        int X,
        int R,
        int W,
        int CFP);
}
