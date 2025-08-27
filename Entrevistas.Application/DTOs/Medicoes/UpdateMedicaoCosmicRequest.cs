namespace Entrevistas.Application.DTOs.Medicoes;

public sealed class UpdateMedicaoCosmicRequest
{
    public Guid Id { get; set; }
    public int EntryE { get; set; }
    public int ExitX { get; set; }
    public int ReadR { get; set; }
    public int WriteW { get; set; }
}
