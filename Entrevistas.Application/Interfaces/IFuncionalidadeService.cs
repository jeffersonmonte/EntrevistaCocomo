using Entrevistas.Application.DTOs.Funcionalidades;

namespace Entrevistas.Application.Interfaces
{
    public interface IFuncionalidadeService
    {
        /// <summary>
        /// Exclui a funcionalidade e sua MedicaoCosmic (1:1) via cascade.
        /// Retorna true se encontrou e excluiu; false se não encontrada.
        /// </summary>
        Task<bool> DeleteAsync(DeleteFuncionalidadeRequest request, CancellationToken ct = default);
        Task<bool> UpdateAsync(UpdateFuncionalidadeRequest request, CancellationToken ct = default);
    }
}
