using Entrevistas.Application.DTOs;
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
	}
}
