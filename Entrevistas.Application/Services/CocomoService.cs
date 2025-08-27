using Entrevistas.Application.DTOs.Cocomo;
using Entrevistas.Application.Interfaces;
using Entrevistas.Domain.Enums;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

// Alias para evitar colisão de nomes com "Entrevista"

namespace Entrevistas.Application.Services;

public sealed class CocomoService : ICocomoService
{
	private readonly AppDbContext _db;

	// Ajuste estes valores conforme seu enum (ex.: 0=COSMIC, 1=PF)
	private const int TipoEntradaCOSMIC = 0;
	private const TipoEntradaTamanho TipoEntradaPF = TipoEntradaTamanho.KLOC;

	private static readonly string[] SF_KEYS = ["PREC", "FLEX", "RESL", "TEAM", "PMAT"];
	private static readonly string[] EM_KEYS = ["RCPX", "RUSE", "PDIF", "PERS", "PREX", "FCIL", "SCED"];
	private const string NIVEL_PADRAO = "Nominal";

	public CocomoService(AppDbContext db) => _db = db;

	public async Task<CocomoResultadoDto> UpsertSelecoesERecalcularAsync(CocomoSelecoesRequest request, CancellationToken ct = default)
	{
		var entrevista = await _db.Entrevistas
			.Include(e => e.ScaleFactors)
			.Include(e => e.EffortMultipliers)
			.Include(e => e.Funcionalidades).ThenInclude(f => f.Medicao)
			.AsTracking()
			.FirstOrDefaultAsync(e => e.Id == request.EntrevistaId, ct)
			?? throw new InvalidOperationException("Entrevista não encontrada.");

		ValidarChaves(request.ScaleFactors, SF_KEYS, "ScaleFactor");
		ValidarChaves(request.EffortMultipliers, EM_KEYS, "EffortMultiplier");

		using var tx = await _db.Database.BeginTransactionAsync(ct);

		// UPSERT SF
		foreach (var key in SF_KEYS)
		{
			var nivel = ObterNivel(request.ScaleFactors, key);
			var fator = await _db.FatoresConversao.AsNoTracking()
				.FirstOrDefaultAsync(f => f.TipoEntrada == "ScaleFactor" && f.Contexto == key && f.Nivel == nivel, ct)
				?? throw new ArgumentException($"Nível inválido para SF '{key}': '{nivel}'.");

			var sf = entrevista.ScaleFactors.FirstOrDefault(x => x.Nome == key);
			if (sf is null)
				_db.ScaleFactors.Add(new Domain.Entities.ScaleFactor { Id = Guid.NewGuid(), EntrevistaId = entrevista.Id, Nome = key, Nivel = nivel, Valor = fator.FatorConversao });
			else
			{
				sf.Nivel = nivel;
				sf.Valor = fator.FatorConversao;
			}
		}

		// UPSERT EM
		foreach (var key in EM_KEYS)
		{
			var nivel = ObterNivel(request.EffortMultipliers, key);
			var fator = await _db.FatoresConversao.AsNoTracking()
				.FirstOrDefaultAsync(f => f.TipoEntrada == "EffortMultiplier" && f.Contexto == key && f.Nivel == nivel, ct)
				?? throw new ArgumentException($"Nível inválido para EM '{key}': '{nivel}'.");

			var em = entrevista.EffortMultipliers.FirstOrDefault(x => x.Nome == key);
			if (em is null)
				_db.EffortMultipliers.Add(new Domain.Entities.EffortMultiplier { Id = Guid.NewGuid(), EntrevistaId = entrevista.Id, Nome = key, Nivel = nivel, Valor = fator.FatorConversao });
			else
			{
				em.Nivel = nivel;
				em.Valor = fator.FatorConversao;
			}
		}

		await _db.SaveChangesAsync(ct);

		// Recalcula TotalCFP
		entrevista.TotalCFP = await _db.MedicoesCosmic
			.Where(m => m.Funcionalidade.EntrevistaId == entrevista.Id)
			.SumAsync(m => m.EntryE + m.ExitX + m.ReadR + m.WriteW, ct);

		// Converte para KLOC
		entrevista.TamanhoKloc = await CalcularKlocAsync(entrevista, entrevista.TotalCFP, ct);

		// Soma SF e produto EM
		entrevista.SomaScaleFactors = await _db.ScaleFactors
			.Where(x => x.EntrevistaId == entrevista.Id)
			.SumAsync(x => x.Valor, ct);

		decimal produtoEM = 1.0m;
		foreach (var em in await _db.EffortMultipliers.Where(x => x.EntrevistaId == entrevista.Id).ToListAsync(ct))
			produtoEM *= em.Valor;
		entrevista.ProdutoEffortMultipliers = produtoEM;

		// Parâmetros
		var param = await _db.ParametrosCocomo.AsNoTracking().OrderBy(p => p.Id).LastOrDefaultAsync(ct)
			?? throw new InvalidOperationException("Parâmetros COCOMO não encontrados.");

		var expoenteE = (decimal)param.B + 0.01m * entrevista.SomaScaleFactors;
		entrevista.EsforcoPM = CalcularPM(param.A, entrevista.TamanhoKloc, expoenteE, produtoEM);
		var F = param.D + 0.2m * (expoenteE - param.B);
		entrevista.PrazoMeses = CalcularPrazo(param.C, F, entrevista.EsforcoPM);

		await _db.SaveChangesAsync(ct);
		await tx.CommitAsync(ct);

		return new CocomoResultadoDto
		{
			EntrevistaId = entrevista.Id,
			TotalCFP = entrevista.TotalCFP,
			TamanhoKloc = entrevista.TamanhoKloc,
			SomaScaleFactors = entrevista.SomaScaleFactors,
			ExpoenteE = expoenteE,
			ProdutoEffortMultipliers = produtoEM,
			EsforcoPM = entrevista.EsforcoPM,
			PrazoMeses = entrevista.PrazoMeses
		};
	}

	public async Task<CocomoSelecoesResponse> GetSelecoesEResultadoAsync(Guid entrevistaId, CancellationToken ct = default)
	{
		var entrevista = await _db.Entrevistas
			.Include(e => e.ScaleFactors)
			.Include(e => e.EffortMultipliers)
			.AsNoTracking()
			.FirstOrDefaultAsync(e => e.Id == entrevistaId, ct)
			?? throw new InvalidOperationException("Entrevista não encontrada.");

		var resp = new CocomoSelecoesResponse
		{
			EntrevistaId = entrevista.Id,
			TotalCFP = entrevista.TotalCFP,
			TamanhoKloc = entrevista.TamanhoKloc,
			SomaScaleFactors = entrevista.SomaScaleFactors,
			ExpoenteE = await ObterExpoenteEAsync(entrevista.SomaScaleFactors, ct),
			ProdutoEffortMultipliers = entrevista.ProdutoEffortMultipliers,
			EsforcoPM = entrevista.EsforcoPM,
			PrazoMeses = entrevista.PrazoMeses
		};

		foreach (var key in SF_KEYS)
			resp.ScaleFactors[key] = entrevista.ScaleFactors.FirstOrDefault(x => x.Nome == key)?.Nivel ?? NIVEL_PADRAO;

		foreach (var key in EM_KEYS)
			resp.EffortMultipliers[key] = entrevista.EffortMultipliers.FirstOrDefault(x => x.Nome == key)?.Nivel ?? NIVEL_PADRAO;

		return resp;
	}

	private async Task<decimal> ObterExpoenteEAsync(decimal somaSF, CancellationToken ct)
	{
		var param = await _db.ParametrosCocomo.AsNoTracking().OrderBy(p => p.Id).LastOrDefaultAsync(ct)
			?? throw new InvalidOperationException("Parâmetros COCOMO não encontrados.");
		return (decimal)param.B + 0.01m * somaSF;
	}

	private static void ValidarChaves(Dictionary<string, string> mapa, string[] esperadas, string grupo)
	{
		var invalidas = mapa.Keys.Where(k => !esperadas.Contains(k, StringComparer.OrdinalIgnoreCase)).ToList();
		if (invalidas.Count > 0)
			throw new ArgumentException($"{grupo}: chaves inválidas: {string.Join(", ", invalidas)}");
	}

	private static string ObterNivel(Dictionary<string, string> mapa, string key)
	{
		if (mapa.TryGetValue(key, out var nivel) && !string.IsNullOrWhiteSpace(nivel))
			return nivel.Trim();
		return NIVEL_PADRAO;
	}

	// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	// Importante: aqui usamos o alias "Domain.Entrevista" para evitar colisão
	// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	private async Task<decimal> CalcularKlocAsync(Domain.Entities.Entrevista entrevista, int totalCfp, CancellationToken ct)
	{
		if (totalCfp <= 0) return 0m;

		if (entrevista.TipoEntrada == TipoEntradaCOSMIC)
		{
			var fator = await _db.ConversoesTamanho.AsNoTracking()
				.Where(c => c.TipoEntrada == "COSMIC" && c.Contexto == "Geral")
				.Select(c => c.FatorConversao)
				.FirstOrDefaultAsync(ct);
			if (fator <= 0m) throw new InvalidOperationException("Fator de conversão COSMIC não configurado.");
			return totalCfp * fator;
		}
		else if (entrevista.TipoEntrada == TipoEntradaPF)
		{
			var contexto = string.IsNullOrWhiteSpace(entrevista.Linguagem) ? "Geral" : entrevista.Linguagem!;
			var fator = await _db.ConversoesTamanho.AsNoTracking()
				.Where(c => c.TipoEntrada == "PF" && c.Contexto == contexto)
				.Select(c => c.FatorConversao)
				.FirstOrDefaultAsync(ct);

			if (fator <= 0m)
				fator = await _db.ConversoesTamanho.AsNoTracking()
					.Where(c => c.TipoEntrada == "PF" && c.Contexto == "Geral")
					.Select(c => c.FatorConversao)
					.FirstOrDefaultAsync(ct);

			if (fator <= 0m) throw new InvalidOperationException("Fator de conversão PF não configurado.");
			return totalCfp * fator;
		}
		else
		{
			throw new InvalidOperationException($"TipoEntrada desconhecido: {entrevista.TipoEntrada}");
		}
	}

	private static decimal CalcularPM(decimal A, decimal kloc, decimal expoenteE, decimal produtoEM)
	{
		if (kloc <= 0m) return 0m;
		double size = (double)kloc;
		double e = (double)expoenteE;
		double pm = (double)A * Math.Pow(size, e) * (double)produtoEM;
		return (decimal)pm;
	}

	private static decimal CalcularPrazo(decimal C, decimal D, decimal pm)
	{
		if (pm <= 0m) return 0m;
		double prazo = (double)C * Math.Pow((double)pm, (double)D);
		return (decimal)prazo;
	}
}
