using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Application.DTOs
{
    public partial class CreateEntrevistaDto
    {
        // Quando informado (>0), este valor é usado como KLOC diretamente.
        public decimal? ValorKloc { get; set; }
    }
}
