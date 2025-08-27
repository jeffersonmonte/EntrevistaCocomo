using Entrevistas.Application.DTOs;

namespace Entrevistas.Application.Interfaces
{
    public interface IFatoresConversaoService
    {
        Task<IEnumerable<FatoresConversaoDto>> ListarTodos();
    }
}
