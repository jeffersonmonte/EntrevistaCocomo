using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Domain.Entities
{
    public class MedicaoCosmic
    {
        public Guid Id { get; set; }
        public Guid FuncionalidadeId { get; set; }
        public int EntryE { get; set; }
        public int ExitX { get; set; }
        public int ReadR { get; set; }
        public int WriteW { get; set; }

        public int CFP => EntryE + ExitX + ReadR + WriteW;
        public Funcionalidade Funcionalidade { get; set; } = default!;
    }
}
