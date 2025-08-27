using Entrevistas.Application.DTOs.Medicoes;

namespace Entrevistas.Application.Interfaces;

public interface IMedicaoCosmicService
{
    Task<bool> UpdateAsync(UpdateMedicaoCosmicRequest request, CancellationToken ct = default);
}
