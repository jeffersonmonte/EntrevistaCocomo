using Entrevistas.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Application.Interfaces
{
    public interface IFatoresConversaoService
    {
        Task<IEnumerable<FatoresConversaoDto>> ListarTodos();
    }
}
