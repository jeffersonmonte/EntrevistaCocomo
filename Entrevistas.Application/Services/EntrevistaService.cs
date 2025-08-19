using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Entrevistas.Domain.Entities;
using Entrevistas.Domain.Enums;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Application.Services
{
    public class EntrevistaService : IEntrevistaService
    {
        private readonly AppDbContext _context;

        public EntrevistaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<EntrevistaOutputDto> CriarEntrevistaAsync(EntrevistaInputDto dto)
        {
            var parametros = await _context.ParametrosCocomo.FirstOrDefaultAsync()
                ?? throw new InvalidOperationException("Parâmetros do COCOMO não configurados.");

            decimal kloc = dto.TipoEntrada switch
            {
                TipoEntradaTamanho.KLOC => dto.ValorKloc ?? throw new ArgumentException("ValorKloc é obrigatório."),
                TipoEntradaTamanho.PontosDeFuncao => await ConverterFPParaKloc(dto),
                TipoEntradaTamanho.Cosmic => await ConverterCosmicParaKloc(dto),
                _ => throw new NotSupportedException("Tipo de entrada não suportado.")
            };

            decimal somaSF = dto.ScaleFactors.Sum(f => f.Valor);
            decimal produtoEM = dto.EffortMultipliers.Aggregate(1m, (acc, e) => acc * e.Valor);

            decimal esforco = parametros.A * (decimal)Math.Pow((double)kloc, (double)(parametros.B + 0.01m * somaSF)) * produtoEM;
            decimal prazo = parametros.C * (decimal)Math.Pow((double)esforco, (double)parametros.D);

            var entrevista = new Domain.Entities.Entrevista
            {
                Id = Guid.NewGuid(),
				NomeEntrevista = dto.NomeEntrevista,
				NomeEntrevistado = dto.NomeEntrevistado,
                NomeEntrevistador = dto.NomeEntrevistador,
                DataEntrevista = dto.DataEntrevista,
                TipoEntrada = dto.TipoEntrada,
                Linguagem = dto.Linguagem,
                TamanhoKloc = Math.Round(kloc, 2),
                SomaScaleFactors = somaSF,
                ProdutoEffortMultipliers = Math.Round(produtoEM, 3),
                EsforcoPM = Math.Round(esforco, 2),
                PrazoMeses = Math.Round(prazo, 2),
                ScaleFactors = dto.ScaleFactors.Select(f => new ScaleFactor
                {
                    Id = Guid.NewGuid(),
                    Nome = f.Nome,
                    Nivel = f.Nivel,
                    Valor = f.Valor
                }).ToList(),
                EffortMultipliers = dto.EffortMultipliers.Select(e => new EffortMultiplier
                {
                    Id = Guid.NewGuid(),
                    Nome = e.Nome,
                    Nivel = e.Nivel,
                    Valor = e.Valor
                }).ToList()
            };

            _context.Entrevistas.Add(entrevista);
            await _context.SaveChangesAsync();

            return new EntrevistaOutputDto
            {
                Id = entrevista.Id,
				NomeEntrevista = entrevista.NomeEntrevista,
				NomeEntrevistado = entrevista.NomeEntrevistado,
                NomeEntrevistador = entrevista.NomeEntrevistador,
                DataEntrevista = entrevista.DataEntrevista,
                Linguagem = entrevista.Linguagem,
                TamanhoKloc = entrevista.TamanhoKloc,
                SomaScaleFactors = entrevista.SomaScaleFactors,
                ProdutoEffortMultipliers = entrevista.ProdutoEffortMultipliers,
                EsforcoPM = entrevista.EsforcoPM,
                PrazoMeses = entrevista.PrazoMeses
            };
        }

        private async Task<decimal> ConverterFPParaKloc(EntrevistaInputDto dto)
        {
            if (dto.PontosDeFuncao == null || string.IsNullOrEmpty(dto.Linguagem))
                throw new ArgumentException("FP e linguagem obrigatórios");

            var taxa = await _context.ConversoesTamanho
                .FirstOrDefaultAsync(c => c.TipoEntrada == "FP" && c.Contexto == dto.Linguagem)
                ?? throw new InvalidOperationException("Conversão FP não encontrada");

            return dto.PontosDeFuncao.Value * taxa.FatorConversao;
        }

        private async Task<decimal> ConverterCosmicParaKloc(EntrevistaInputDto dto)
        {
            var total = (dto.Entradas ?? 0) + (dto.Saidas ?? 0) + (dto.Leitura ?? 0) + (dto.Gravacao ?? 0);

            var taxa = await _context.ConversoesTamanho
                .FirstOrDefaultAsync(c => c.TipoEntrada == "COSMIC")
                ?? throw new InvalidOperationException("Conversão COSMIC não encontrada");

            return total * taxa.FatorConversao;
        }

        public async Task<IEnumerable<EntrevistaOutputDto>> ListarEntrevistasAsync()
        {
            return await _context.Entrevistas
                .AsNoTracking()
                .Select(e => new EntrevistaOutputDto
                {
                    Id = e.Id,
                    NomeEntrevistado = e.NomeEntrevistado,
                    NomeEntrevistador = e.NomeEntrevistador,
                    DataEntrevista = e.DataEntrevista,
                    Linguagem = e.Linguagem,
                    TamanhoKloc = e.TamanhoKloc,
                    SomaScaleFactors = e.SomaScaleFactors,
                    ProdutoEffortMultipliers = e.ProdutoEffortMultipliers,
                    EsforcoPM = e.EsforcoPM,
                    PrazoMeses = e.PrazoMeses,
                    TotalCFP = e.TotalCFP,
                    NomeEntrevista = e.NomeEntrevista
                }).ToListAsync();
        }

        public async Task<EntrevistaOutputDto?> ObterPorIdAsync(Guid id)
        {
            var e = await _context.Entrevistas
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);

            return e == null ? null : new EntrevistaOutputDto
            {
                Id = e.Id,
                NomeEntrevistado = e.NomeEntrevistado,
                NomeEntrevistador = e.NomeEntrevistador,
                DataEntrevista = e.DataEntrevista,
                Linguagem = e.Linguagem,
                TamanhoKloc = e.TamanhoKloc,
                SomaScaleFactors = e.SomaScaleFactors,
                ProdutoEffortMultipliers = e.ProdutoEffortMultipliers,
                EsforcoPM = e.EsforcoPM,
                PrazoMeses = e.PrazoMeses,
                TotalCFP = e.TotalCFP,
                NomeEntrevista = e.NomeEntrevista,
                TipoEntrada = e.TipoEntrada
            };
        }
        public async Task<Guid> AdicionarFuncionalidadeAsync(Guid entrevistaId, NovaFuncDto dto)
        {
            var func = new Funcionalidade
            {
                EntrevistaId = entrevistaId,
                Nome = dto.Nome,
                Template = dto.Template,
                Observacoes = dto.Observacoes
            };
            _context.Funcionalidades.Add(func);

            var med = new MedicaoCosmic
            {
                FuncionalidadeId = func.Id,
                EntryE = dto.Medicao.E,
                ExitX = dto.Medicao.X,
                ReadR = dto.Medicao.R,
                WriteW = dto.Medicao.W
            };
            _context.MedicoesCosmic.Add(med);

            await _context.SaveChangesAsync();
            return func.Id;
        }

        public async Task<IReadOnlyList<FuncionalidadeVm>> ListarFuncionalidadesAsync(Guid entrevistaId)
        {
            return await _context.Funcionalidades
                .Where(f => f.EntrevistaId == entrevistaId)
                .Select(f => new FuncionalidadeVm(
                    f.Id, f.Nome, f.Template, f.Observacoes,
                    f.Medicao.EntryE, f.Medicao.ExitX, f.Medicao.ReadR, f.Medicao.WriteW,
                    f.Medicao.EntryE + f.Medicao.ExitX + f.Medicao.ReadR + f.Medicao.WriteW
                ))
                .ToListAsync();
        }

        public async Task<RecalculoCosmicVm> RecalcularCosmicAsync(Guid entrevistaId)
        {
            var ent = await _context.Entrevistas.FirstAsync(e => e.Id == entrevistaId);

            var totalCfp = await _context.MedicoesCosmic
                .Where(m => m.Funcionalidade.EntrevistaId == entrevistaId)
                .SumAsync(m => (int?)(m.EntryE + m.ExitX + m.ReadR + m.WriteW)) ?? 0;

            // Conversao: procurar por TipoEntrada='COSMIC' e Contexto = ent.Linguagem, caindo para 'Padrão'
            var taxa = await _context.ConversoesTamanho
                .Where(c => c.TipoEntrada == "COSMIC" && (c.Contexto == ent.Linguagem || c.Contexto == "Padrão"))
                .OrderByDescending(c => c.Contexto == ent.Linguagem) // específica primeiro
                .Select(c => c.FatorConversao)
                .FirstOrDefaultAsync();

            decimal kloc = 0m;
            if (taxa > 0)
            {
                // Convenção do projeto: FatorConversao = UNIDADES por KLOC (ex: CFP/KLOC)
                kloc = Math.Round(totalCfp / taxa, 3);
            }

            ent.TotalCFP = totalCfp;
            ent.TamanhoKloc = kloc;

            await _context.SaveChangesAsync();

            return new RecalculoCosmicVm(totalCfp, kloc);
        }

        public async Task<CreateEntrevistaResult> CriarEntrevistaComCosmicAsync(CreateEntrevistaDto dto)
        {
            using var tx = await _context.Database.BeginTransactionAsync();

            var ent = new Entrevistas.Domain.Entities.Entrevista
            {
                Id = Guid.NewGuid(),
                NomeEntrevista = dto.NomeEntrevista,
                NomeEntrevistado = dto.NomeEntrevistado,
                NomeEntrevistador = dto.NomeEntrevistador,
                DataEntrevista = dto.DataEntrevista,
                Linguagem = dto.Linguagem,
                TamanhoKloc = (dto.TipoEntrada == 1) ? dto.ValorKloc : 0,
                // Se você já persiste SF/EM na entrevista, pode mapear aqui a partir de dto.ScaleFactors/EffortMultipliers
            };
            _context.Entrevistas.Add(ent);
            await _context.SaveChangesAsync();

            int totalCfp = 0;

            // Insere funcionalidades + medições COSMIC (se vierem)
            if (dto.Funcionalidades != null && dto.Funcionalidades.Count > 0)
            {
                foreach (var f in dto.Funcionalidades)
                {
                    var func = new Funcionalidade
                    {
                        Id = Guid.NewGuid(),
                        EntrevistaId = ent.Id,
                        Nome = f.Nome,
                        Template = f.Template,
                        Observacoes = f.Observacoes
                    };
                    _context.Funcionalidades.Add(func);

                    var med = new MedicaoCosmic
                    {
                        Id = Guid.NewGuid(),
                        FuncionalidadeId = func.Id,
                        EntryE = f.E,
                        ExitX = f.X,
                        ReadR = f.R,
                        WriteW = f.W
                    };
                    _context.MedicoesCosmic.Add(med);

                    totalCfp += (f.E + f.X + f.R + f.W);
                }

                await _context.SaveChangesAsync();
            }

            // Recalcula KLOC a partir de CFP e ConversoesTamanho
            if (totalCfp > 0)
            {
                var fator = await _context.ConversoesTamanho
                    .Where(c => c.TipoEntrada == "COSMIC"
                             && (c.Contexto == ent.Linguagem || c.Contexto == "Padrão" || c.Contexto == null))
                    .OrderByDescending(c => c.Contexto == ent.Linguagem) // específica primeiro
                    .Select(c => c.FatorConversao)                        // CFP por KLOC
                    .FirstOrDefaultAsync();

                decimal kloc = 0m;
                if (fator > 0)
                    kloc = Math.Round(totalCfp / fator, 3);

                ent.TotalCFP = totalCfp;
                ent.TamanhoKloc = kloc; // sobrepõe o valor manual se COSMIC foi informado
                await _context.SaveChangesAsync();
            }

            await tx.CommitAsync();
            return new CreateEntrevistaResult(ent.Id, ent.TotalCFP, ent.TamanhoKloc);
        }

    }
}
