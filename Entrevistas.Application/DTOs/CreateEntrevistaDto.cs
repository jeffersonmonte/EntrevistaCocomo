using System;
using System.Collections.Generic;

namespace Entrevistas.Application.DTOs
{
    // Se você já tiver esse DTO, pode remover esta definição.
    public record ScaleEffortItemDto(string Nome, string Nivel, decimal Valor);

    public record CreateEntrevistaDto(
        string NomeEntrevistado,
        string NomeEntrevistador,
        DateTime DataEntrevista,
        int TipoEntrada,          // 1=KLOC, 2=PF
        decimal ValorKloc,
        decimal PontosDeFuncao,
        string? Linguagem,
        int Entradas,
        int Saidas,
        int Leitura,
        int Gravacao,
        IEnumerable<ScaleEffortItemDto>? ScaleFactors,
        IEnumerable<ScaleEffortItemDto>? EffortMultipliers,
        List<FuncInlineDto>? Funcionalidades // << NOVO
    );
}
