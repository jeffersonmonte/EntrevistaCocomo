using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
﻿using Entrevistas.Application.DTOs;

namespace Entrevistas.Application.Interfaces
{
    public interface IEntrevistaService
    {
        Task<EntrevistaOutputDto> CriarEntrevistaAsync(EntrevistaInputDto dto);
        Task<IEnumerable<EntrevistaOutputDto>> ListarEntrevistasAsync();
        Task<EntrevistaOutputDto?> ObterPorIdAsync(Guid id);

        Task<Guid> AdicionarFuncionalidadeAsync(Guid entrevistaId, NovaFuncDto dto);
        Task<IReadOnlyList<FuncionalidadeVm>> ListarFuncionalidadesAsync(Guid entrevistaId);
        Task<RecalculoCosmicVm> RecalcularCosmicAsync(Guid entrevistaId);
        Task<CreateEntrevistaResult> CriarEntrevistaComCosmicAsync(CreateEntrevistaDto dto);
    }
}
