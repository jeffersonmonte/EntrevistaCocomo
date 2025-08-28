using Entrevistas.Application.DTOs;
using Entrevistas.Domain.Entities;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.Application.Services
{
    public class MonteCarloService : IMonteCarloService
    {
        private readonly AppDbContext _context;

        public MonteCarloService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MonteCarloSummaryDto> RodarParaEntrevistaAsync(Guid entrevistaId, MonteCarloOptionsDto options)
        {
            var ent = await _context.Entrevistas
                .Include(x => x.ScaleFactors)
                .Include(x => x.EffortMultipliers)
                .FirstOrDefaultAsync(x => x.Id == entrevistaId)
                ?? throw new InvalidOperationException("Entrevista não encontrada.");

            var parametros = await _context.ParametrosCocomo.FirstOrDefaultAsync()
                ?? throw new InvalidOperationException("Parâmetros do COCOMO não configurados.");

            if (ent.TamanhoKloc <= 0)
                throw new InvalidOperationException("KLOC da entrevista ainda não calculado/definido.");

            int N = Math.Max(1000, options.Iterations);
            var pm = new double[N];
            var td = new double[N];

            // Constantes
            double A = (double)parametros.A;
            double B = (double)parametros.B;
            double C = (double)parametros.C;
            double D = (double)parametros.D;

            // Determinísticos a partir da entrevista
            double produtoEM = ent.EffortMultipliers.Aggregate(1.0m, (acc, e) => acc * e.Valor) is var em
                ? (double)em : 1.0;
            double somaSF = (double)ent.ScaleFactors.Sum(f => f.Valor);

            // Triangular KLOC
            double mode = (double)ent.TamanhoKloc;
            double a = (double)(options.KlocMin ?? (decimal)(0.9 * mode));
            double m = (double)(options.KlocMode ?? (decimal)mode);
            double b = (double)(options.KlocMax ?? (decimal)(1.2 * mode));

            var rng = new Random();

            for (int i = 0; i < N; i++)
            {
                double size = SampleTri(rng, a, m, b);
                double E = B + 0.01 * somaSF;
                double PM = A * Math.Pow(size, E) * produtoEM;
                double F = D + 0.2 * (E - B);
                double TDEV = C * Math.Pow(PM, F);
                pm[i] = PM;
                td[i] = TDEV;
            }

            Array.Sort(pm);
            Array.Sort(td);

            double Mean(double[] v) => v.Average();
            double Std(double[] v)
            {
                double mu = Mean(v);
                return Math.Sqrt(v.Select(x => (x - mu) * (x - mu)).Average());
            }
            double P(double[] v, double p)
            {
                if (p <= 0) return v[0];
                if (p >= 1) return v[^1];
                double idx = (v.Length - 1) * p;
                int lo = (int)Math.Floor(idx);
                int hi = (int)Math.Ceiling(idx);
                if (lo == hi) return v[lo];
                return v[lo] + (idx - lo) * (v[hi] - v[lo]);
            }

            return new MonteCarloSummaryDto
            {
                P10_PM = (decimal)P(pm, 0.10),
                P50_PM = (decimal)P(pm, 0.50),
                P90_PM = (decimal)P(pm, 0.90),
                Media_PM = (decimal)Mean(pm),
                Desvio_PM = (decimal)Std(pm),

                P10_TDEV = (decimal)P(td, 0.10),
                P50_TDEV = (decimal)P(td, 0.50),
                P90_TDEV = (decimal)P(td, 0.90),
                Media_TDEV = (decimal)Mean(td),
                Desvio_TDEV = (decimal)Std(td),
            };
        }

        private static double SampleTri(Random r, double a, double m, double b)
        {
            double u = r.NextDouble();
            double Fm = (m - a) / (b - a);
            return u < Fm
                ? a + Math.Sqrt(u * (b - a) * (m - a))
                : b - Math.Sqrt((1 - u) * (b - a) * (b - m));
        }



        public async Task<MonteCarloRunDto> RodarESalvarAsync(Guid entrevistaId, MonteCarloOptionsDto options, bool overwriteAtual)
        {
            var sum = await RodarParaEntrevistaAsync(entrevistaId, options);

            var ent = await _context.Entrevistas
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == entrevistaId)
                ?? throw new ArgumentException("Entrevista não encontrada");

            var pars = await _context.ParametrosCocomo.AsNoTracking().FirstAsync();
            var A = pars.A; var B = pars.B; var C = pars.C; var D = pars.D;

            var novo = new MonteCarloResultado
            {
                EntrevistaId = entrevistaId,
                Iterations = options.Iterations,
                KlocMin = options.KlocMin,
                KlocMode = options.KlocMode,
                KlocMax = options.KlocMax,

                A = A,
                B = B,
                C = C,
                D = D,
                SomaScaleFactors = ent.SomaScaleFactors,
                ProdutoEffortMultipliers = ent.ProdutoEffortMultipliers,
                TamanhoKloc = ent.TamanhoKloc,

                P10_PM = sum.P10_PM,
                P50_PM = sum.P50_PM,
                P90_PM = sum.P90_PM,
                Media_PM = sum.Media_PM,
                Desvio_PM = sum.Desvio_PM,
                P10_TDEV = sum.P10_TDEV,
                P50_TDEV = sum.P50_TDEV,
                P90_TDEV = sum.P90_TDEV,
                Media_TDEV = sum.Media_TDEV,
                Desvio_TDEV = sum.Desvio_TDEV,
                IsAtual = false
            };

            if (overwriteAtual)
            {
                // Desmarca o atual anterior
                var anteriores = await _context.MonteCarloResultados
                    .Where(x => x.EntrevistaId == entrevistaId && x.IsAtual)
                    .ToListAsync();
                foreach (var a in anteriores) a.IsAtual = false;
                novo.IsAtual = true;
            }

            _context.MonteCarloResultados.Add(novo);
            await _context.SaveChangesAsync();

            return new MonteCarloRunDto
            {
                Id = novo.Id,
                EntrevistaId = entrevistaId,
                CreatedAt = novo.CreatedAt,
                IsAtual = novo.IsAtual,
                Iterations = novo.Iterations,
                KlocMin = novo.KlocMin,
                KlocMode = novo.KlocMode,
                KlocMax = novo.KlocMax,
                P10_PM = novo.P10_PM,
                P50_PM = novo.P50_PM,
                P90_PM = novo.P90_PM,
                Media_PM = novo.Media_PM,
                Desvio_PM = novo.Desvio_PM,
                P10_TDEV = novo.P10_TDEV,
                P50_TDEV = novo.P50_TDEV,
                P90_TDEV = novo.P90_TDEV,
                Media_TDEV = novo.Media_TDEV,
                Desvio_TDEV = novo.Desvio_TDEV,
            };
        }

        public async Task<MonteCarloRunDto?> ObterUltimoAsync(Guid entrevistaId)
        {
            var r = await _context.MonteCarloResultados
                .Where(x => x.EntrevistaId == entrevistaId)
                .OrderByDescending(x => x.IsAtual) // prioriza “atual”
                .ThenByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            return r == null ? null : new MonteCarloRunDto
            {
                Id = r.Id,
                EntrevistaId = r.EntrevistaId,
                CreatedAt = r.CreatedAt,
                IsAtual = r.IsAtual,
                Iterations = r.Iterations,
                KlocMin = r.KlocMin,
                KlocMode = r.KlocMode,
                KlocMax = r.KlocMax,
                P10_PM = r.P10_PM,
                P50_PM = r.P50_PM,
                P90_PM = r.P90_PM,
                Media_PM = r.Media_PM,
                Desvio_PM = r.Desvio_PM,
                P10_TDEV = r.P10_TDEV,
                P50_TDEV = r.P50_TDEV,
                P90_TDEV = r.P90_TDEV,
                Media_TDEV = r.Media_TDEV,
                Desvio_TDEV = r.Desvio_TDEV,
            };
        }

        public async Task<IReadOnlyList<MonteCarloRunDto>> ListarAsync(Guid entrevistaId)
        {
            return await _context.MonteCarloResultados
                .Where(x => x.EntrevistaId == entrevistaId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(r => new MonteCarloRunDto
                {
                    Id = r.Id,
                    EntrevistaId = r.EntrevistaId,
                    CreatedAt = r.CreatedAt,
                    IsAtual = r.IsAtual,
                    Iterations = r.Iterations,
                    KlocMin = r.KlocMin,
                    KlocMode = r.KlocMode,
                    KlocMax = r.KlocMax,
                    P10_PM = r.P10_PM,
                    P50_PM = r.P50_PM,
                    P90_PM = r.P90_PM,
                    Media_PM = r.Media_PM,
                    Desvio_PM = r.Desvio_PM,
                    P10_TDEV = r.P10_TDEV,
                    P50_TDEV = r.P50_TDEV,
                    P90_TDEV = r.P90_TDEV,
                    Media_TDEV = r.Media_TDEV,
                    Desvio_TDEV = r.Desvio_TDEV,
                })
                .ToListAsync();
        }

        public async Task MarcarComoAtualAsync(Guid entrevistaId, Guid runId)
        {
            var runs = await _context.MonteCarloResultados
                .Where(x => x.EntrevistaId == entrevistaId)
                .ToListAsync();

            foreach (var r in runs) r.IsAtual = r.Id == runId;
            await _context.SaveChangesAsync();
        }

        public async Task RemoverAsync(Guid entrevistaId, Guid runId)
        {
            var r = await _context.MonteCarloResultados
                .FirstOrDefaultAsync(x => x.EntrevistaId == entrevistaId && x.Id == runId);
            if (r != null)
            {
                _context.MonteCarloResultados.Remove(r);
                await _context.SaveChangesAsync();
            }
        }
    }
}
