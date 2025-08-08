using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Application.DTOs
{
    public record FuncionalidadeVm(
        Guid Id,
        string Nome,
        string? Template,
        string? Observacoes,
        int E,
        int X,
        int R,
        int W,
        int CFP);
}
