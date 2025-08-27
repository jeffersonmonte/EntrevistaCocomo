using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Entrevistas.Application.DTOs.Entrevistas
{
    public partial class UpdateEntrevistaRequest
    {
		// Se informado(>0), substitui o KLOC calculado.
		[JsonPropertyName("valorKloc")]
		public decimal? ValorKloc { get; set; }
    }
}
