using Entrevistas.Application.DTOs;

namespace Entrevistas.Application.Interfaces
{
    public interface ITamanhoService
    {
        Task<ResultadoCocomoDto> CalcularCocomoAsync(TamanhoSistemaDto dto);
    }
}
