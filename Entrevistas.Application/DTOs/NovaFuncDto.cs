using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Application.DTOs
{
    public record NovaFuncDto(string Nome, string? Template, string? Observacoes, MedicaoDto Medicao);
}
