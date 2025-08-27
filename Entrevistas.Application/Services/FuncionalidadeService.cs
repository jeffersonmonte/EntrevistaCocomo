using Entrevistas.Application.DTOs.Funcionalidades;
using Entrevistas.Application.Interfaces;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Infrastructure.Services;

public sealed class FuncionalidadeService : IFuncionalidadeService
{
    private readonly AppDbContext _db;

    public FuncionalidadeService(AppDbContext db) => _db = db;

    public async Task<bool> DeleteAsync(DeleteFuncionalidadeRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Funcionalidades
            .AsTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (entity is null)
            return false;

        _db.Funcionalidades.Remove(entity); // MedicaoCosmic é removida em cascade (1:1)
        await _db.SaveChangesAsync(ct);
        return true;
    }
    public async Task<bool> UpdateAsync(UpdateFuncionalidadeRequest request, CancellationToken ct = default)
    {
        var entity = await _db.Funcionalidades.AsTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (entity is null) return false;

        entity.Nome = request.Nome.Trim();
        entity.Template = string.IsNullOrWhiteSpace(request.Template) ? null : request.Template!.Trim();
        entity.Observacoes = string.IsNullOrWhiteSpace(request.Observacoes) ? null : request.Observacoes!.Trim();

        // Obs: a UQ(EntrevistaId, Nome) é garantida por índice único. 
        // Se renomear para um já existente na mesma entrevista, o SaveChanges lançará exceção de UQ.
        await _db.SaveChangesAsync(ct);
        return true;
    }
}