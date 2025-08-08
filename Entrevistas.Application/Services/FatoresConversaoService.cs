using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Entrevista.Application.Services;

public class FatoresConversaoService : IFatoresConversaoService
{
    private readonly AppDbContext _context;

    public FatoresConversaoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<FatoresConversaoDto>> ListarTodos()
    {
        return await _context.FatoresConversao
                .AsNoTracking()
                .Select(x => new FatoresConversaoDto
                {
                    Id = x.Id,
                    TipoEntrada = x.TipoEntrada,
                    Contexto = x.Contexto,
                    Nivel = x.Nivel,
                    FatorConversao = x.FatorConversao,
                    NomeCompleto = x.NomeCompleto,
                    Descricao = x.Descricao
                }).ToListAsync();
    }
}
