using Entrevistas.Application.DTOs.Medicoes;
using Entrevistas.Application.Interfaces;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Infrastructure.Services;

public sealed class MedicaoCosmicService : IMedicaoCosmicService
{
    private readonly AppDbContext _db;

    public MedicaoCosmicService(AppDbContext db) => _db = db;

    public async Task<bool> UpdateAsync(UpdateMedicaoCosmicRequest request, CancellationToken ct = default)
    {
        if (request.EntryE < 0 || request.ExitX < 0 || request.ReadR < 0 || request.WriteW < 0)
            throw new ArgumentOutOfRangeException("Valores de E/X/R/W não podem ser negativos.");

        var entity = await _db.MedicoesCosmic
            .Include(m => m.Funcionalidade)
            .ThenInclude(f => f.Entrevista)
            .AsTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (entity is null) return false;

        entity.EntryE = request.EntryE;
        entity.ExitX = request.ExitX;
        entity.ReadR = request.ReadR;
        entity.WriteW = request.WriteW;

        // Atualiza TotalCFP da entrevista (soma de todas as medicoes)
        var entrevistaId = entity.Funcionalidade.EntrevistaId;
        var totalCfp = await _db.MedicoesCosmic
            .Where(m => m.Funcionalidade.EntrevistaId == entrevistaId)
            .SumAsync(m => m.EntryE + m.ExitX + m.ReadR + m.WriteW, ct);

        entity.Funcionalidade.Entrevista.TotalCFP = totalCfp;

        await _db.SaveChangesAsync(ct);
        return true;
    }
}
