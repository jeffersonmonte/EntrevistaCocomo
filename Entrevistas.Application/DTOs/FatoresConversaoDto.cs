namespace Entrevistas.Application.DTOs;

public class FatoresConversaoDto
{
    public int Id { get; set; }
    public string TipoEntrada { get; set; } = null!;
    public string Contexto { get; set; } = null!;
    public string Nivel { get; set; } = null!;
    public decimal FatorConversao { get; set; }

    public string? NomeCompleto { get; set; }
    public string? Descricao { get; set; }
}
