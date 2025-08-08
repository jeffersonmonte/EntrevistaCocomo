using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Domain.Entities
{
    public class ParametrosCocomo
    {
        public int Id { get; set; } // sempre 1
        public decimal A { get; set; } = 2.94m;
        public decimal B { get; set; } = 0.91m;
        public decimal C { get; set; } = 3.67m;
        public decimal D { get; set; } = 0.28m;
    }
}
