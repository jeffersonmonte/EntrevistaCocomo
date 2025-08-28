namespace Entrevistas.Application.DTOs
{
    public interface IMonteCarloService
    {
        Task<MonteCarloSummaryDto> RodarParaEntrevistaAsync(Guid entrevistaId, MonteCarloOptionsDto options);
        Task<MonteCarloRunDto> RodarESalvarAsync(Guid entrevistaId, MonteCarloOptionsDto options, bool overwriteAtual);
        Task<MonteCarloRunDto?> ObterUltimoAsync(Guid entrevistaId);
        Task<IReadOnlyList<MonteCarloRunDto>> ListarAsync(Guid entrevistaId);
        Task MarcarComoAtualAsync(Guid entrevistaId, Guid runId);
        Task RemoverAsync(Guid entrevistaId, Guid runId);
    }
}
