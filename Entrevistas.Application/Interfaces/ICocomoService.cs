using Entrevistas.Application.DTOs.Cocomo;

namespace Entrevistas.Application.Interfaces
{
    public interface ICocomoService
    {
        /// <summary>
        /// Persiste as seleções de SF/EM da entrevista (UPSERT) e recalcula KLOC, PM e Prazo,
        /// atualizando os campos da tabela Entrevistas e retornando o resultado.
        /// Qualquer fator/multiplicador ausente é assumido "Nominal".
        /// </summary>
        Task<CocomoResultadoDto> UpsertSelecoesERecalcularAsync(CocomoSelecoesRequest request, CancellationToken ct = default);

        Task<CocomoSelecoesResponse> GetSelecoesEResultadoAsync(Guid entrevistaId, CancellationToken ct = default);
    }
}
