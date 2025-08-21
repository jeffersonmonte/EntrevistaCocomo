
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * COCOMO II (Early Design) — Documentação
 * - 1) Fórmulas principais
 * - 2) Fatores de Escala (5 itens)
 * - 3) Multiplicadores de Esforço (7 itens)
 * - 4) Monte Carlo
 * - 5) Conversões de tamanho
 * - 6) Parâmetros do modelo
 * - 7) Bibliografia (Fontes) — com links clicáveis
 */
export default function DocsFormulas() {
  // -------- Tabelas oficiais (Early Design) --------
  // SF: valores (VL, L, N, H, VH, XH=0.00)
  const SF = [
    { code: 'PREC', name: 'Precedência (Precedentedness)', desc: 'Experiência com projetos similares.', values: { VL: 6.20, L: 4.96, N: 3.72, H: 2.48, VH: 1.24, XH: 0.00 } },
    { code: 'FLEX', name: 'Flexibilidade de Processo (Development Flexibility)', desc: 'Liberdade para adaptar o processo.', values: { VL: 5.07, L: 4.05, N: 3.04, H: 2.03, VH: 1.01, XH: 0.00 } },
    { code: 'RESL', name: 'Resolução de Riscos (Architecture/Risk Resolution)', desc: 'Maturidade na identificação/mitigação de riscos.', values: { VL: 7.07, L: 5.65, N: 4.24, H: 2.83, VH: 1.41, XH: 0.00 } },
    { code: 'TEAM', name: 'Coesão da Equipe (Team Cohesion)', desc: 'Alinhamento, comunicação, objetivos comuns.', values: { VL: 5.48, L: 4.38, N: 3.29, H: 2.19, VH: 1.10, XH: 0.00 } },
    { code: 'PMAT', name: 'Maturidade do Processo (Process Maturity)', desc: 'Formalização de processos (CMMI).', values: { VL: 7.80, L: 6.24, N: 4.68, H: 3.12, VH: 1.56, XH: 0.00 } },
  ];

  // EM: valores (XL, VL, L, N, H, VH, XH) — alguns drivers não têm todos os níveis
  const EM = [
    { code: 'PERS', name: 'Capacidade da Equipe (Personnel Capability)', desc: 'Habilidade técnica e produtividade do time.', values: { XL: 2.12, VL: 1.62, L: 1.26, N: 1.00, H: 0.83, VH: 0.63, XH: 0.50 } },
    { code: 'RCPX', name: 'Confiabilidade/Complexidade do Produto (RCPX)', desc: 'Confiabilidade, complexidade e conteúdo de dados.', values: { XL: 0.49, VL: 0.60, L: 0.83, N: 1.00, H: 1.33, VH: 1.91, XH: 2.72 } },
    { code: 'PDIF', name: 'Dificuldade da Plataforma (Platform Difficulty)', desc: 'Restrições de plataforma/SO/hardware/comunicação.', values: { XL: null, VL: 0.87, L: 1.00, N: 1.29, H: 1.81, VH: 2.61, XH: null } },
    { code: 'PREX', name: 'Experiência da Equipe (Personnel Experience)', desc: 'Experiência em domínio, linguagem, ferramentas.', values: { XL: 1.59, VL: 1.33, L: 1.12, N: 1.00, H: 0.87, VH: 0.74, XH: 0.62 } },
    { code: 'FCIL', name: 'Instalações/Ferramentas (Facilities)', desc: 'Ferramentas, repositórios, integrações, automação.', values: { XL: 1.43, VL: 1.30, L: 1.10, N: 1.00, H: 0.87, VH: 0.73, XH: 0.62 } },
    { code: 'RUSE', name: 'Reutilização Requerida (Required Reuse)', desc: 'Grau de reuso exigido.', values: { XL: null, VL: 0.95, L: 1.00, N: 1.07, H: 1.15, VH: 1.24, XH: null } },
    { code: 'SCED', name: 'Cronograma Requerido (Required Dev. Schedule)', desc: 'Compressão/relaxamento de prazo.', values: { XL: null, VL: 1.43, L: 1.14, N: 1.00, H: 1.00, VH: 1.00, XH: null } },
  ];

  const br2 = (n) => n == null ? '—' : Number(n).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">COCOMO II (Early Design) — Fórmulas, Fatores e Multiplicadores</h1>
        <Link to="/entrevistas" className="text-blue-700 underline text-sm">← Voltar</Link>
      </div>

      {/* 1) Fórmulas principais */}
      <section>
        <h2 className="text-xl font-semibold">1) Fórmulas principais</h2>
        <pre className="bg-gray-900 text-white text-xs p-3 rounded overflow-x-auto">
{`E = B + 0.01 × ΣSF
PM = A × (KLOC)^E × Π EM
TDEV = C × (PM)^D
Pessoas ≈ PM / TDEV`}
        </pre>
        <p className="text-xs text-gray-600 mt-2">
          <b>Unidades:</b> PM (pessoa‑mês), TDEV (meses). Percentis, média e desvio (Monte Carlo) também são reportados nessas unidades.
        </p>
      </section>

      {/* 2) Fatores de Escala */}
      <section id="sf" className="space-y-3">
        <h2 className="text-xl font-semibold">2) Fatores de Escala (5 itens)</h2>
        <p className="text-sm">
          Os Fatores de Escala (<b>SF</b>) afetam o <b>expoente</b> <code>E</code> do esforço: quanto maior a soma, maior o crescimento do esforço.
          <br/>No Early Design somamos 5 fatores: <b>PREC</b>, <b>FLEX</b>, <b>RESL</b>, <b>TEAM</b>, <b>PMAT</b>. Cada fator tem níveis (VL, L, N, H, VH, XH) com pesos numéricos.
        </p>
        <ul className="list-disc ml-6 text-sm">
          {SF.map((f) => (
            <li key={f.code}><b>{f.code}</b> — {f.name}: {f.desc}</li>
          ))}
        </ul>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-[720px] text-sm border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left">Fator (SF)</th>
                <th className="px-2 py-2">VL</th>
                <th className="px-2 py-2">L</th>
                <th className="px-2 py-2">N</th>
                <th className="px-2 py-2">H</th>
                <th className="px-2 py-2">VH</th>
                <th className="px-2 py-2">XH</th>
              </tr>
            </thead>
            <tbody>
              {SF.map((f) => (
                <tr key={f.code} className="border-t">
                  <td className="px-2 py-2"><span className="font-mono">{f.code}</span></td>
                  <td className="px-2 py-2 text-center">{br2(f.values.VL)}</td>
                  <td className="px-2 py-2 text-center">{br2(f.values.L)}</td>
                  <td className="px-2 py-2 text-center">{br2(f.values.N)}</td>
                  <td className="px-2 py-2 text-center">{br2(f.values.H)}</td>
                  <td className="px-2 py-2 text-center">{br2(f.values.VH)}</td>
                  <td className="px-2 py-2 text-center">{br2(f.values.XH)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-600"><b>Uso no cálculo:</b> <code>E = B + 0.01 × (PREC + FLEX + RESL + TEAM + PMAT)</code>.</div>
      </section>

      {/* 3) Multiplicadores de Esforço */}
      <section id="em" className="space-y-3">
        <h2 className="text-xl font-semibold">3) Multiplicadores de Esforço (7 itens)</h2>
        <p className="text-sm">
          Os Multiplicadores de Esforço (<b>EM</b>) atuam como produto multiplicativo no esforço.
          <br/>No Early Design usamos 7 itens: <b>PERS</b>, <b>RCPX</b>, <b>PDIF</b>, <b>PREX</b>, <b>FCIL</b>, <b>RUSE</b>, <b>SCED</b>.
        </p>
        <ul className="list-disc ml-6 text-sm">
          {EM.map((m) => (
            <li key={m.code}><b>{m.code}</b> — {m.name}: {m.desc}</li>
          ))}
        </ul>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-[900px] text-sm border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left">Multiplicador (EM)</th>
                <th className="px-2 py-2">XL</th>
                <th className="px-2 py-2">VL</th>
                <th className="px-2 py-2">L</th>
                <th className="px-2 py-2">N</th>
                <th className="px-2 py-2">H</th>
                <th className="px-2 py-2">VH</th>
                <th className="px-2 py-2">XH</th>
              </tr>
            </thead>
            <tbody>
              {EM.map((m) => (
                <tr key={m.code} className="border-t">
                  <td className="px-2 py-2"><span className="font-mono">{m.code}</span></td>
                  <td className="px-2 py-2 text-center">{br2(m.values.XL)}</td>
                  <td className="px-2 py-2 text-center">{br2(m.values.VL)}</td>
                  <td className="px-2 py-2 text-center">{br2(m.values.L)}</td>
                  <td className="px-2 py-2 text-center">{br2(m.values.N)}</td>
                  <td className="px-2 py-2 text-center">{br2(m.values.H)}</td>
                  <td className="px-2 py-2 text-center">{br2(m.values.VH)}</td>
                  <td className="px-2 py-2 text-center">{br2(m.values.XH)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-600"><b>Uso no cálculo:</b> <code>PM = A × KLOC^E × (PERS × RCPX × PDIF × PREX × FCIL × RUSE × SCED)</code>.</div>
      </section>

      {/* 4) Monte Carlo */}
      <section id="montecarlo">
        <h2 className="text-xl font-semibold">4) Monte Carlo (opcional)</h2>
        <pre className="bg-gray-900 text-white text-xs p-3 rounded overflow-x-auto">
{`POST /api/entrevistas/{id}/cocomo/monte-carlo
Body: { enabled, iterations>=1000, klocMin?, klocMode?, klocMax? }
Defaults: a=0.9×KLOC, b=KLOC, c=1.2×KLOC
Saída: p10/p50/p90 + média + desvio (PM e TDEV)`}
        </pre>
      </section>

      {/* 5) Conversões */}
      <section id="conversoes" className="space-y-2">
        <h2 className="text-xl font-semibold">5) Conversões de tamanho</h2>
        <ul className="list-disc ml-6 text-sm">
          <li><b>Entrada KLOC</b>: usa o valor informado.</li>
          <li><b>PF → KLOC</b>: <code>KLOC = PF × taxa_por_linguagem</code> (a taxa depende da linguagem/framework).</li>
          <li><b>COSMIC → KLOC</b>: (i) genérico: <code>KLOC = CFP × taxa</code>; (ii) “recalcular COSMIC”: <code>KLOC = CFP ÷ taxa</code> (taxa em UNIDADES/KLOC).</li>
        </ul>
        <div className="text-xs text-gray-700">
          <b>COSMIC é independente de linguagem/tecnologia</b> (mede somente tamanho funcional). Por isso, no formulário a
          <b> linguagem fica desabilitada</b> quando o usuário escolhe COSMIC.
        </div>
      </section>

      {/* 6) Parâmetros */}
      <section id="parametros">
        <h2 className="text-xl font-semibold">6) Parâmetros do modelo</h2>
        <p className="text-sm">Padrões (ajustáveis via API): <b>A=2.94</b>, <b>B=0.91</b>, <b>C=3.67</b>, <b>D=0.28</b>.</p>
      </section>

      {/* 7) Bibliografia — links clicáveis */}
      <section id="bibliografia" className="space-y-2">
        <h2 className="text-xl font-semibold">7) Bibliografia (Fontes)</h2>
        <ul className="list-disc ml-6 text-sm">
          <li>
            <b>Livro:</b> Boehm, B. et al. <i>Software Cost Estimation with COCOMO II</i> —{' '}
            <a href="https://dl.acm.org/doi/10.5555/557000" target="_blank" rel="noreferrer">ACM/DOI</a> ·{' '}
            <a href="https://books.google.com/books/about/Software_Cost_Estimation_with_Cocomo_II.html?id=8eopAQAAMAAJ" target="_blank" rel="noreferrer">Google Books</a>
          </li>
          <li>
            <b>Site oficial (USC CSSE / COCOMO II):</b>{' '}
            <a href="https://softwarecost.org/" target="_blank" rel="noreferrer">softwarecost.org</a>
          </li>
          <li>
            <b>Manual COCOMO II (PDF):</b>{' '}
            <a href="https://www.rose-hulman.edu/class/cs/csse372/201310/Homework/CII_modelman2000.pdf" target="_blank" rel="noreferrer">Mirror 1</a>{' '}·{' '}
            <a href="https://www.cs.montana.edu/courses/spring2004/352/public/cocomo/modelman.pdf" target="_blank" rel="noreferrer">Mirror 2</a>{' '}·{' '}
            <a href="https://athena.ecs.csus.edu/~buckley/CSc231_files/Cocomo_II_Manual.pdf" target="_blank" rel="noreferrer">Mirror 3</a>
          </li>
          <li>
            <b>COSMIC — site oficial:</b>{' '}
            <a href="https://cosmic-sizing.org" target="_blank" rel="noreferrer">cosmic-sizing.org</a>
          </li>
          <li>
            <b>COSMIC — Measurement Manual (PDF):</b>{' '}
            <a href="https://cosmic-sizing.org/publications/" target="_blank" rel="noreferrer">Página de publicações oficiais</a>
          </li>
          <li>
            <b>COSMIC — Sobre requisitos técnicos (NFR):</b>{' '}
            <a href="https://cosmic-sizing.org" target="_blank" rel="noreferrer">Conceitos oficiais</a>
          </li>
        </ul>
        <p className="text-xs text-gray-600">Observação: o backend está calibrado para <b>Early Design</b> com <code>TDEV = C × PM^D</code> e distribuição triangular para Monte Carlo.</p>
      </section>
    </div>
  );
}
