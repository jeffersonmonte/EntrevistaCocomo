using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Entrevistas.Domain.Entities;
using Entrevistas.Domain.Enums;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using System;

namespace Entrevistas.Application.Services
{
    public class TamanhoService : ITamanhoService
    {
        private readonly AppDbContext _context;

        public TamanhoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResultadoCocomoDto> CalcularCocomoAsync(TamanhoSistemaDto dto)
        {
            // Obter parâmetros do COCOMO
            var parametros = await _context.ParametrosCocomo.FirstOrDefaultAsync();
            if (parametros is null)
                throw new InvalidOperationException("Parâmetros do COCOMO não configurados.");

            decimal sizeKloc;

            switch (dto.TipoEntrada)
            {
                case TipoEntradaTamanho.KLOC:
                    sizeKloc = dto.ValorKLOC ?? throw new ArgumentException("ValorKLOC é obrigatório.");
                    break;

                case TipoEntradaTamanho.PontosDeFuncao:
                    if (dto.PontosDeFuncao is null || string.IsNullOrEmpty(dto.Linguagem))
                        throw new ArgumentException("PontosDeFuncao e Linguagem são obrigatórios.");

                    var taxaFP = await _context.ConversoesTamanho
                        .FirstOrDefaultAsync(c => c.TipoEntrada == "FP" && c.Contexto == dto.Linguagem);

                    if (taxaFP is null)
                        throw new InvalidOperationException($"Taxa de conversão para FP na linguagem '{dto.Linguagem}' não encontrada.");

                    sizeKloc = dto.PontosDeFuncao.Value * taxaFP.FatorConversao;
                    break;

                case TipoEntradaTamanho.Cosmic:
                    var totalCFP = (dto.Entradas ?? 0) + (dto.Saidas ?? 0) + (dto.Leitura ?? 0) + (dto.Gravacao ?? 0);

                    var taxaCosmic = await _context.ConversoesTamanho
                        .FirstOrDefaultAsync(c => c.TipoEntrada == "COSMIC");

                    if (taxaCosmic is null)
                        throw new InvalidOperationException("Taxa de conversão para COSMIC não encontrada.");

                    sizeKloc = totalCFP * taxaCosmic.FatorConversao;
                    break;

                default:
                    throw new NotSupportedException("Tipo de entrada não suportado.");
            }

            // Fatores simulados (em versão final, você vai trazer do cadastro do usuário ou da entrevista)
            var somaSF = 16m; // soma dos 5 SFs
            var produtoEM = 1.12m; // multiplicação dos 7 EMs

            var esforco = parametros.A * (decimal)Math.Pow((double)sizeKloc, (double)(parametros.B + 0.01m * somaSF)) * produtoEM;
            var prazo = parametros.C * (decimal)Math.Pow((double)esforco, (double)parametros.D);

            return new ResultadoCocomoDto
            {
                KlocConvertido = Math.Round(sizeKloc, 2),
                EsforcoPM = Math.Round(esforco, 2),
                PrazoMeses = Math.Round(prazo, 2)
            };
        }
    }
}

