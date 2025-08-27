namespace Entrevistas.Application.DTOs
{
	public record FuncInlineDto
	{
		public string Nome { get; init; } = string.Empty;
		public string? Template { get; init; }
		public string? Observacoes { get; init; }
		public int E { get; init; }
		public int X { get; init; }
		public int R { get; init; }
		public int W { get; init; }
	}
}
