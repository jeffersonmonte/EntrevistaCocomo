using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Entrevistas.Application.DTOs;
using Entrevistas.Application.DTOs.Entrevistas;
using Entrevistas.Application.Interfaces;
using Entrevistas.Domain.Entities;
using Entrevistas.Domain.Enums;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Application.Services
{
    public class EntrevistaService : IEntrevistaService
    {
        private readonly AppDbContext _db;

        public EntrevistaService(AppDbContext db) => _db = db;

        // =====================================================================================
        // CREATE (fluxo com EntrevistaInputDto)
        // =====================================================================================
        public async Task<EntrevistaOutputDto> CriarEntrevistaAsync(EntrevistaInputDto dto)
        {
            // Determina KLOC conforme TipoEntrada
            decimal kloc = 0m;
            int totalCFP = 0;

            if (dto.TipoEntrada == TipoEntradaTamanho.KLOC)
            {
                kloc = (dto.ValorKloc ?? 0m);
            }
            else if (dto.TipoEntrada == TipoEntradaTamanho.PontosDeFuncao)
            {
                if (dto.ValorKloc.HasValue && dto.ValorKloc.Value > 0)
                {
                    kloc = dto.ValorKloc.Value;
                }
                else
                {
                    var fator = await ObterFatorConversaoAsync("PF", dto.Linguagem, ct: default);
                    var pf = (dto.PontosDeFuncao ?? 0);
                    kloc = Math.Round(pf * fator, 6, MidpointRounding.AwayFromZero);
                }
            }
            else if (dto.TipoEntrada == TipoEntradaTamanho.Cosmic)
            {
                var e = dto.Entradas ?? 0;
                var x = dto.Saidas ?? 0;
                var r = dto.Leitura ?? 0;
                var w = dto.Gravacao ?? 0;
                totalCFP = e + x + r + w;

                var fator = await ObterFatorConversaoAsync("COSMIC", "Geral", ct: default);
                kloc = Math.Round(totalCFP * fator, 6, MidpointRounding.AwayFromZero);
            }

            // Parâmetros COCOMO
            var parametros = await _db.ParametrosCocomo.AsNoTracking().FirstOrDefaultAsync()
                            ?? new ParametrosCocomo { A = 2.94m, B = 0.91m, C = 3.67m, D = 0.28m };

            decimal somaSF = (dto.ScaleFactors ?? new()).Sum(f => f.Valor);
            decimal produtoEM = (dto.EffortMultipliers ?? new()).Aggregate(1m, (acc, e) => acc * e.Valor);

            var expoente = parametros.B + 0.01m * somaSF;
            decimal esforco = Math.Round(parametros.A * (decimal)Math.Pow((double)kloc, (double)expoente) * produtoEM, 6, MidpointRounding.AwayFromZero);
            decimal prazo = Math.Round(parametros.C * (decimal)Math.Pow((double)esforco, (double)parametros.D), 6, MidpointRounding.AwayFromZero);

            var ent = new Domain.Entities.Entrevista
            {
                Id = Guid.NewGuid(),
                NomeEntrevista = dto.NomeEntrevista.Trim(),
                DataEntrevista = dto.DataEntrevista,
                TipoEntrada = dto.TipoEntrada,
                Linguagem = string.IsNullOrWhiteSpace(dto.Linguagem) ? null : dto.Linguagem!.Trim(),
                TamanhoKloc = kloc,
                SomaScaleFactors = somaSF,
                ProdutoEffortMultipliers = produtoEM,
                EsforcoPM = esforco,
                PrazoMeses = prazo,
                TotalCFP = totalCFP
            };

            // Itens relacionados
            ent.ScaleFactors = (dto.ScaleFactors ?? new())
                .Select(s => new ScaleFactor { Id = Guid.NewGuid(), EntrevistaId = ent.Id, Nome = s.Nome, Nivel = s.Nivel, Valor = s.Valor })
                .ToList();

            ent.EffortMultipliers = (dto.EffortMultipliers ?? new())
                .Select(m => new EffortMultiplier { Id = Guid.NewGuid(), EntrevistaId = ent.Id, Nome = m.Nome, Nivel = m.Nivel, Valor = m.Valor })
                .ToList();

            _db.Entrevistas.Add(ent);
            await _db.SaveChangesAsync();

            return new EntrevistaOutputDto
            {
                Id = ent.Id,
                NomeEntrevista = ent.NomeEntrevista,
                DataEntrevista = ent.DataEntrevista,
                Linguagem = ent.Linguagem,
                TamanhoKloc = ent.TamanhoKloc,
                SomaScaleFactors = ent.SomaScaleFactors,
                ProdutoEffortMultipliers = ent.ProdutoEffortMultipliers,
                EsforcoPM = ent.EsforcoPM,
                PrazoMeses = ent.PrazoMeses,
                TotalCFP = ent.TotalCFP,
                TipoEntrada = ent.TipoEntrada
            };
        }

        // =====================================================================================
        // LIST / GET
        // =====================================================================================
        public async Task<IEnumerable<EntrevistaOutputDto>> ListarEntrevistasAsync()
        {
            var list = await _db.Entrevistas.AsNoTracking().ToListAsync();

            return list.Select(e => new EntrevistaOutputDto
            {
                Id = e.Id,
                NomeEntrevista = e.NomeEntrevista,
                DataEntrevista = e.DataEntrevista,
                Linguagem = e.Linguagem,
                TamanhoKloc = e.TamanhoKloc,
                SomaScaleFactors = e.SomaScaleFactors,
                ProdutoEffortMultipliers = e.ProdutoEffortMultipliers,
                EsforcoPM = e.EsforcoPM,
                PrazoMeses = e.PrazoMeses,
                TotalCFP = e.TotalCFP,
                TipoEntrada = e.TipoEntrada
            });
        }

        public async Task<EntrevistaOutputDto?> ObterPorIdAsync(Guid id)
        {
            var e = await _db.Entrevistas.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (e == null) return null;

            return new EntrevistaOutputDto
            {
                Id = e.Id,
                NomeEntrevista = e.NomeEntrevista,
                DataEntrevista = e.DataEntrevista,
                Linguagem = e.Linguagem,
                TamanhoKloc = e.TamanhoKloc,
                SomaScaleFactors = e.SomaScaleFactors,
                ProdutoEffortMultipliers = e.ProdutoEffortMultipliers,
                EsforcoPM = e.EsforcoPM,
                PrazoMeses = e.PrazoMeses,
                TotalCFP = e.TotalCFP,
                TipoEntrada = e.TipoEntrada
            };
        }

        // =====================================================================================
        // FUNCIONALIDADES (COSMIC)
        // =====================================================================================
        public async Task<Guid> AdicionarFuncionalidadeAsync(Guid entrevistaId, NovaFuncDto dto)
        {
            var ent = await _db.Entrevistas
                .Include(x => x.Funcionalidades).ThenInclude(f => f.Medicao)
                .Include(x => x.ScaleFactors)
                .Include(x => x.EffortMultipliers)
                .FirstOrDefaultAsync(x => x.Id == entrevistaId);

            if (ent == null)
                throw new KeyNotFoundException("Entrevista não encontrada.");

            // E/X/R/W vêm de dto.Medicao (int)
            var eVal = dto.Medicao.E;
            var xVal = dto.Medicao.X;
            var rVal = dto.Medicao.R;
            var wVal = dto.Medicao.W;

            var fid = Guid.NewGuid();
            var func = new Funcionalidade
            {
                Id = fid,
                EntrevistaId = ent.Id,
                Nome = dto.Nome,
                Template = dto.Template,
                Observacoes = dto.Observacoes,
                Medicao = new MedicaoCosmic
                {
                    Id = Guid.NewGuid(),
                    FuncionalidadeId = fid,
                    EntryE = eVal,
                    ExitX = xVal,
                    ReadR = rVal,
                    WriteW = wVal
                }
            };

            _db.Funcionalidades.Add(func);
            await _db.SaveChangesAsync();

            await RecontarCfpERecalcularAsync(entrevistaId, ent.TipoEntrada, ent.Linguagem);
            return fid;
        }

        public async Task<IReadOnlyList<FuncionalidadeVm>> ListarFuncionalidadesAsync(Guid entrevistaId)
        {
            var funcs = await _db.Funcionalidades
                .AsNoTracking()
                .Include(f => f.Medicao)
                .Where(f => f.EntrevistaId == entrevistaId)
                .ToListAsync();

            return funcs.Select(f =>
            {
                int e = f.Medicao?.EntryE ?? 0;
                int x = f.Medicao?.ExitX ?? 0;
                int r = f.Medicao?.ReadR ?? 0;
                int w = f.Medicao?.WriteW ?? 0;
                int total = e + x + r + w;
                return new FuncionalidadeVm(f.Id, f.Nome, f.Template, f.Observacoes, e, x, r, w, total);
            }).ToList();
        }

        public async Task<RecalculoCosmicVm> RecalcularCosmicAsync(Guid entrevistaId)
        {
            var ent = await _db.Entrevistas
                .Include(e => e.Funcionalidades).ThenInclude(f => f.Medicao)
                .Include(e => e.ScaleFactors)
                .Include(e => e.EffortMultipliers)
                .FirstOrDefaultAsync(x => x.Id == entrevistaId);

            if (ent == null)
                throw new KeyNotFoundException("Entrevista não encontrada.");

            await RecontarCfpERecalcularAsync(ent.Id, ent.TipoEntrada, ent.Linguagem);
            await _db.SaveChangesAsync();

            // Record: (int TotalCFP, decimal Kloc)
            return new RecalculoCosmicVm(ent.TotalCFP, ent.TamanhoKloc);
        }

        // =====================================================================================
        // CREATE (rota com CreateEntrevistaDto — pode vir com Funcionalidades)
        // =====================================================================================
        public async Task<CreateEntrevistaResult> CriarEntrevistaComCosmicAsync(CreateEntrevistaDto dto)
        {
            var ent = new Domain.Entities.Entrevista
            {
                Id = Guid.NewGuid(),
                NomeEntrevista = dto.NomeEntrevista.Trim(),
                DataEntrevista = dto.DataEntrevista,
                TipoEntrada = dto.TipoEntrada,
                Linguagem = string.IsNullOrWhiteSpace(dto.Linguagem) ? null : dto.Linguagem!.Trim()
            };

            // SF/EM
            ent.ScaleFactors = (dto.ScaleFactors ?? new List<ScaleFactorDto>()).Select(s =>
                new ScaleFactor { Id = Guid.NewGuid(), EntrevistaId = ent.Id, Nome = s.Nome, Nivel = s.Nivel, Valor = s.Valor }).ToList();

            ent.EffortMultipliers = (dto.EffortMultipliers ?? new List<EffortMultiplierDto>()).Select(m =>
                new EffortMultiplier { Id = Guid.NewGuid(), EntrevistaId = ent.Id, Nome = m.Nome, Nivel = m.Nivel, Valor = m.Valor }).ToList();

            // Funcionalidades (se vierem) OU somatórios do DTO
            int totalCFP = 0;
            if (dto.Funcionalidades is { Count: > 0 })
            {
                ent.Funcionalidades = dto.Funcionalidades.Select(f =>
                {
                    var fid = Guid.NewGuid();
                    totalCFP += (f.E + f.X + f.R + f.W);
                    return new Funcionalidade
                    {
                        Id = fid,
                        EntrevistaId = ent.Id,
                        Nome = f.Nome,
                        Template = f.Template,
                        Observacoes = f.Observacoes,
                        Medicao = new MedicaoCosmic
                        {
                            Id = Guid.NewGuid(),
                            FuncionalidadeId = fid,
                            EntryE = f.E,
                            ExitX = f.X,
                            ReadR = f.R,
                            WriteW = f.W
                        }
                    };
                }).ToList();
            }
            else
            {
                totalCFP = dto.Entradas + dto.Saidas + dto.Leitura + dto.Gravacao;
            }
            ent.TotalCFP = totalCFP;

            // KLOC
            decimal kloc = 0m;
            if (ent.TipoEntrada == TipoEntradaTamanho.Cosmic)
            {
                var fator = await ObterFatorConversaoAsync("COSMIC", "Geral", ct: default);
                kloc = Math.Round(ent.TotalCFP * fator, 6, MidpointRounding.AwayFromZero);
            }
            else if (ent.TipoEntrada == TipoEntradaTamanho.KLOC)
            {
                // CreateEntrevistaDto atual não tem ValorKloc; mantenha 0 ou ajuste a partial abaixo.
                kloc = 0m; // CreateEntrevistaDto atual não tem ValorKloc; mantenha 0 ou ajuste a partial abaixo.
            }
            else if (ent.TipoEntrada == TipoEntradaTamanho.PontosDeFuncao)
            {
                // CreateEntrevistaDto não traz PF explícito — mantemos 0
                kloc = 0m;
            }
            ent.TamanhoKloc = kloc;

            // COCOMO
            await RecalcularCocomoEarlyDesignAsync(ent);

            _db.Entrevistas.Add(ent);
            await _db.SaveChangesAsync();

            return new CreateEntrevistaResult(ent.Id, ent.TotalCFP, ent.TamanhoKloc);
        }

        // =====================================================================================
        // UPDATE
        // =====================================================================================
        public async Task<bool> UpdateAsync(UpdateEntrevistaRequest request, CancellationToken ct = default)
        {
			// Carregue a entrevista com filhos TRACKED
			var ent = await _db.Entrevistas
				.Include(e => e.ScaleFactors)
				.Include(e => e.EffortMultipliers)
				.FirstOrDefaultAsync(e => e.Id == request.Id, ct);

			if (ent is null) return false;

			// Atualize campos básicos da entrevista
			ent.NomeEntrevista = request.NomeEntrevista?.Trim();
			ent.DataEntrevista = request.DataEntrevista;
			ent.TipoEntrada = (TipoEntradaTamanho)request.TipoEntrada;
			ent.Linguagem = request.Linguagem;
			ent.TamanhoKloc = request.ValorKloc ?? ent.TamanhoKloc;
			// ... (demais campos diretos)

			// 1) Remover os atuais (de fato) e salvar para “limpar” o estado
			if (ent.EffortMultipliers?.Count > 0)
				_db.EffortMultipliers.RemoveRange(ent.EffortMultipliers);
			if (ent.ScaleFactors?.Count > 0)
				_db.ScaleFactors.RemoveRange(ent.ScaleFactors);

			await _db.SaveChangesAsync(ct);

			// 2) Montar NOVAS listas a partir do request, SEM id reaproveitado
			var novosEM = (request.EffortMultipliers ?? Enumerable.Empty<EffortMultiplierDto>())
				.Select(m => new EffortMultiplier
				{
					Id = Guid.NewGuid(),                 // garante INSERT
					EntrevistaId = ent.Id,
					Nome = m.Nome,
					Nivel = m.Nivel,
					Valor = m.Valor
				})
				.ToList();

			var novosSF = (request.ScaleFactors ?? Enumerable.Empty<ScaleFactorDto>())
				.Select(s => new ScaleFactor
				{
					Id = Guid.NewGuid(),                 // garante INSERT
					EntrevistaId = ent.Id,
					Nome = s.Nome,
					Nivel = s.Nivel,
					Valor = s.Valor
				})
				.ToList();

			// 3) Adicionar explicitamente como ADDED (evita UPDATE acidental)
			if (novosEM.Count > 0) _db.EffortMultipliers.AddRange(novosEM);
			if (novosSF.Count > 0) _db.ScaleFactors.AddRange(novosSF);

			// (Opcional) se preferir manter via navegação, também pode:
			// ent.EffortMultipliers = novosEM;
			// ent.ScaleFactors = novosSF;
			// _db.Entry(ent).State = EntityState.Modified; // só para os campos scalar da Entrevista

			// 4) Recalcule derivadas (seu método atual já fazia isso)
			ent.SomaScaleFactors = novosSF.Sum(x => (decimal)x.Valor);
			ent.ProdutoEffortMultipliers = novosEM.Aggregate(1m, (acc, x) => acc * (decimal)x.Valor);

			// TODO: aplicar fórmula de esforço/prazo (A,B,C,D) conforme seus parâmetros
			// ent.EsforcoPM = ...
			// ent.PrazoMeses = ...

			await RecalcularCocomoEarlyDesignAsync(ent, ct);

			await _db.SaveChangesAsync(ct);
			return true;

		}

		public async Task<bool> DeleteAsync(DeleteEntrevistaRequest request, CancellationToken ct = default)
        {
            var ent = await _db.Entrevistas.FirstOrDefaultAsync(e => e.Id == request.Id, ct);
            if (ent == null) return false;

            _db.Entrevistas.Remove(ent); // Cascade cuida de SF/EM/Func/Medicao
            await _db.SaveChangesAsync(ct);
            return true;
        }

        // =====================================================================================
        // Helpers
        // =====================================================================================
        private async Task RecontarCfpERecalcularAsync(Guid entrevistaId, TipoEntradaTamanho tipoEntrada, string? linguagem)
        {
            var ent = await _db.Entrevistas
                .Include(e => e.Funcionalidades).ThenInclude(f => f.Medicao)
                .Include(e => e.ScaleFactors)
                .Include(e => e.EffortMultipliers)
                .FirstAsync(e => e.Id == entrevistaId);

            ent.TotalCFP = ent.Funcionalidades.Sum(f =>
                (f.Medicao?.EntryE ?? 0) +
                (f.Medicao?.ExitX ?? 0) +
                (f.Medicao?.ReadR ?? 0) +
                (f.Medicao?.WriteW ?? 0));

            // Atualiza KLOC conforme tipo
            if (tipoEntrada == TipoEntradaTamanho.Cosmic)
            {
                var fator = await ObterFatorConversaoAsync("COSMIC", "Geral", ct: default);
                ent.TamanhoKloc = Math.Round(ent.TotalCFP * fator, 6, MidpointRounding.AwayFromZero);
            }
            else if (tipoEntrada == TipoEntradaTamanho.PontosDeFuncao)
            {
                // sem PF explícito aqui; mantém ent.TamanhoKloc
            }

            await RecalcularCocomoEarlyDesignAsync(ent);
            await _db.SaveChangesAsync();
        }

        private async Task<decimal> ObterFatorConversaoAsync(string tipoEntrada, string? contexto, CancellationToken ct = default)
        {
            tipoEntrada = tipoEntrada.ToUpperInvariant();
            string ctx = string.IsNullOrWhiteSpace(contexto) ? "Padrão" : contexto!.Trim();

            if (tipoEntrada == "COSMIC" && string.IsNullOrWhiteSpace(contexto))
                ctx = "Geral";

            var conv = await _db.ConversoesTamanho.AsNoTracking()
                .FirstOrDefaultAsync(x => x.TipoEntrada == tipoEntrada && x.Contexto == ctx, ct);

            if (conv == null && tipoEntrada == "PF" && ctx != "Padrão")
            {
                conv = await _db.ConversoesTamanho.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.TipoEntrada == tipoEntrada && x.Contexto == "Padrão", ct);
            }

            return conv?.FatorConversao ?? (tipoEntrada == "COSMIC" ? 0.025m : 0m);
        }

        private async Task RecalcularCocomoEarlyDesignAsync(Domain.Entities.Entrevista ent, CancellationToken ct = default)
        {
            var p = await _db.ParametrosCocomo.AsNoTracking().FirstOrDefaultAsync(ct)
                    ?? new ParametrosCocomo { A = 2.94m, B = 0.91m, C = 3.67m, D = 0.28m };

            ent.SomaScaleFactors = ent.ScaleFactors.Sum(s => s.Valor);
            ent.ProdutoEffortMultipliers = ent.EffortMultipliers.Aggregate(1m, (acc, e) => acc * e.Valor);

            var expoente = p.B + 0.01m * ent.SomaScaleFactors;
            ent.EsforcoPM = Math.Round(p.A * (decimal)Math.Pow((double)ent.TamanhoKloc, (double)expoente) * ent.ProdutoEffortMultipliers, 6, MidpointRounding.AwayFromZero);
            ent.PrazoMeses = Math.Round(p.C * (decimal)Math.Pow((double)ent.EsforcoPM, (double)p.D), 6, MidpointRounding.AwayFromZero);
        }

		public async Task<EntrevistaDetailDto?> ObterDetalheAsync(Guid id, CancellationToken ct = default)
		{
			var ent = await _db.Entrevistas
				.Include(e => e.ScaleFactors)
				.Include(e => e.EffortMultipliers)
				.Include(e => e.Funcionalidades).ThenInclude(f => f.Medicao)
				.AsNoTracking()
				.FirstOrDefaultAsync(e => e.Id == id, ct);

			if (ent is null) return null;

			return new EntrevistaDetailDto
			{
				Id = ent.Id,
				NomeEntrevista = ent.NomeEntrevista,
				DataEntrevista = ent.DataEntrevista,
				TipoEntrada = (int)ent.TipoEntrada,
				Linguagem = ent.Linguagem,
				TamanhoKloc = ent.TamanhoKloc,
				SomaScaleFactors = ent.SomaScaleFactors,
				ProdutoEffortMultipliers = ent.ProdutoEffortMultipliers,
				EsforcoPM = ent.EsforcoPM,
				PrazoMeses = ent.PrazoMeses,
				TotalCFP = ent.TotalCFP,
				ScaleFactors = ent.ScaleFactors
					.Select(s => new ScaleFactorDto(s.Nome, s.Nivel, s.Valor)).ToList(),
				EffortMultipliers = ent.EffortMultipliers
					.Select(m => new EffortMultiplierDto(m.Nome, m.Nivel, m.Valor)).ToList(),
				Funcionalidades = ent.Funcionalidades.Select(
                    f => new FuncInlineDto
				        {
						    Nome = f.Nome,
					        Template = f.Template,
					        Observacoes = f.Observacoes,
					        E = f.Medicao?.EntryE ?? 0,
					        X = f.Medicao?.ExitX ?? 0,
					        R = f.Medicao?.ReadR ?? 0,
					        W = f.Medicao?.WriteW ?? 0
				        }).ToList()
			};
		}
	}
}