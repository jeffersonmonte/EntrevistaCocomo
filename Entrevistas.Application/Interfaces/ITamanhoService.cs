using Entrevistas.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Application.Interfaces
{
    public interface ITamanhoService
    {
        Task<ResultadoCocomoDto> CalcularCocomoAsync(TamanhoSistemaDto dto);
    }
}
