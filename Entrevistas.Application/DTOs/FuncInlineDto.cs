namespace Entrevistas.Application.DTOs
{
    public record FuncInlineDto(
        string Nome,
        string? Template,
        string? Observacoes,
        int E,
        int X,
        int R,
        int W
    );
}
