using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entrevistas.Domain.Entities
{
    public class ConversaoTamanho
    {
        public int Id { get; set; } // chave primária
        public string TipoEntrada { get; set; } = string.Empty; // "FP" ou "COSMIC"
        public string Contexto { get; set; } = string.Empty; // Linguagem (ex: Java, .NET) ou "Padrão"
        public decimal FatorConversao { get; set; } // ex: 53 FP = 1 KLOC → fator = 1/53
    }
}
