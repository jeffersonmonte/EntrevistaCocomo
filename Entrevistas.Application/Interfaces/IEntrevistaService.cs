using Entrevistas.Application.DTOs;
using Entrevistas.Application.DTOs.Entrevistas;

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

        /// <summary>
        /// Exclui a entrevista e todas as dependências (SF/EM/Funcionalidades/MedicoesCosmic) via cascade.
        /// Retorna true se encontrou e excluiu; false se não encontrada.
        /// </summary>
        Task<bool> DeleteAsync(DeleteEntrevistaRequest request, CancellationToken ct = default);
        Task<bool> UpdateAsync(UpdateEntrevistaRequest request, CancellationToken ct = default);
		Task<EntrevistaDetailDto?> ObterDetalheAsync(Guid id, CancellationToken ct = default);
	}
}
