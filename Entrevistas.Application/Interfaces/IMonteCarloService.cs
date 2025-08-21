using System;
using System.Threading.Tasks;

namespace Entrevistas.Application.DTOs
{
    public interface IMonteCarloService
    {
        Task<MonteCarloSummaryDto> RodarParaEntrevistaAsync(Guid entrevistaId, MonteCarloOptionsDto options);
    }
}
