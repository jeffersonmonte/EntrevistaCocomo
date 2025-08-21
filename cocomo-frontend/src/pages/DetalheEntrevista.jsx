
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useLocation, Link } from 'react-router-dom';

// Cache local do MC
const MC_CACHE_PREFIX = 'mcResumo:';
function loadMcLocal(id) {
  try {
    const raw = localStorage.getItem(MC_CACHE_PREFIX + id);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && obj.resumo ? obj : null;
  } catch {
    return null;
  }
}
function saveMcLocal(id, resumoComMeta) {
  try {
    const payload = { resumo: resumoComMeta, savedAt: new Date().toISOString() };
    localStorage.setItem(MC_CACHE_PREFIX + id, JSON.stringify(payload));
  } catch {}
}

function fmt(v) {
  if (v === undefined || v === null || Number.isNaN(+v)) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}
function fmtDateBR(iso) {
  try {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(iso || '—');
  }
}

// --------- Normalizador (aceita maiúsc./minúsc., com/sem _; objetos/planos) ---------
function normalizeMc(payloadIn) {
  if (!payloadIn) return null;

  const tryParseFlatString = (s) => {
    const out = {};
    String(s).split(/[;,|\n]/).forEach(raw => {
      const kv = raw.split(/[:=]\s*/);
      if (kv.length >= 2) out[kv[0].trim()] = kv.slice(1).join('=').trim();
    });
    return Object.keys(out).length ? out : null;
  };
  const num = (v) => {
    if (v === null || v === undefined || v === '') return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (typeof v === 'string') {
      let s = v.trim();
      if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
      else if (s.includes(',')) s = s.replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };
  const coerce = (o) => {
    if (!o) return {};
    const out = {};
    const set = (k, v) => { const n = num(v); if (n !== undefined) out[k] = n; };
    set('p10', o.p10 ?? o.P10 ?? o['10'] ?? o.p_10 ?? o['0.1']);
    set('p50', o.p50 ?? o.P50 ?? o['50'] ?? o.mediana ?? o.p_50 ?? o['0.5']);
    set('p90', o.p90 ?? o.P90 ?? o['90'] ?? o.p_90 ?? o['0.9']);
    set('media', o.media ?? o.mean ?? o.avg ?? o.Media);
    set('dp', o.dp ?? o.std ?? o.desvioPadrao ?? o.Desvio ?? o.desvio);
    set('min', o.min ?? o.Min);
    set('max', o.max ?? o.Max);
    return out;
  };

  let obj = payloadIn;
  if (typeof obj === 'string') {
    const flat = tryParseFlatString(obj);
    if (flat) obj = flat; else return null;
  }
  const root = obj.data || obj.result || obj.resultado || obj;

  const ci = {};
  Object.keys(root || {}).forEach(k => (ci[k.toLowerCase().replace(/_/g, '')] = root[k]));
  const val = (...keys) => {
    for (const k of keys) {
      if (root && root[k] !== undefined) return root[k];
      const lk = k.toLowerCase().replace(/_/g, '');
      if (ci[lk] !== undefined) return ci[lk];
    }
    return undefined;
  };

  // 1) objetos aninhados
  let pm = val('pm','esforco','esforcoPm','esforcoPM');
  let td = val('tdev','prazo','tdevMeses','duracaoMeses');
  if (Array.isArray(pm) && pm.length >= 3) pm = { p10: pm[0], p50: pm[1], p90: pm[2] };
  if (Array.isArray(td) && td.length >= 3) td = { p10: td[0], p50: td[1], p90: td[2] };
  if (pm || td) {
    const out1 = { pm: coerce(pm || {}), tdev: coerce(td || {}) };
    if (Number.isFinite(out1.pm.p50) || Number.isFinite(out1.tdev.p50)) return out1;
  }

  // 2) planas
  const pmFlat = {
    p10:   val('P10_PM','p10_PM','P10PM','p10pm','pmP10'),
    p50:   val('P50_PM','p50_PM','P50PM','p50pm','pmP50'),
    p90:   val('P90_PM','p90_PM','P90PM','p90pm','pmP90'),
    media: val('Media_PM','media_PM','MediaPM','mediapm','pmMedia'),
    dp:    val('Desvio_PM','desvio_PM','Dp_PM','dp_PM','Std_PM','std_PM','pmDp','pmStd'),
    min:   val('Min_PM','min_PM','pmMin'),
    max:   val('Max_PM','max_PM','pmMax'),
  };
  const tdFlat = {
    p10:   val('P10_TDEV','p10_TDEV','P10TDEV','p10tdev','tdevP10','prazoP10'),
    p50:   val('P50_TDEV','p50_TDEV','P50TDEV','p50tdev','tdevP50','prazoP50'),
    p90:   val('P90_TDEV','p90_TDEV','P90TDEV','p90tdev','tdevP90','prazoP90'),
    media: val('Media_TDEV','media_TDEV','MediaTDEV','mediatdev','tdevMedia','prazoMedia'),
    dp:    val('Desvio_TDEV','desvio_TDEV','Dp_TDEV','dp_TDEV','Std_TDEV','std_TDEV','tdevDp','tdevStd','prazoDp'),
    min:   val('Min_TDEV','min_TDEV','tdevMin'),
    max:   val('Max_TDEV','max_TDEV','tdevMax'),
  };
  const out2 = { pm: coerce(pmFlat), tdev: coerce(tdFlat) };
  if (Number.isFinite(out2.pm.p50) || Number.isFinite(out2.tdev.p50)) return out2;

  // 3) fallback DTO determinístico
  const pmDet  = val('esforcoPM','esforco','pm','pessoaMes');
  const tdDet  = val('prazoMeses','duracao','tdev','prazo');
  if (pmDet !== undefined || tdDet !== undefined) {
    return { pm: coerce({ p50: pmDet }), tdev: coerce({ p50: tdDet }) };
  }
  return null;
}

async function tryGetMc(base, id) {
  const candidates = [
    `${base}/${id}/cocomo/monte-carlo`,
    `${base}/${id}/cocomo/monte-carlo/resultado`,
    `${base}/${id}/cocomo/monte-carlo/resumo`,
    `${base}/${id}/cocomo/monte-carlo/summary`,
    `${base}/${id}/cocomo/monte-carlo/sumario`,
    `${base}/${id}/cocomo/monte-carlo/ultimo`,
    `${base}/${id}/cocomo/monte-carlo/latest`,
  ];
  for (const url of candidates) {
    try {
      const r = await axios.get(url);
      const norm = normalizeMc((r && r.data) || {});
      if (norm) return { norm, raw: { url, data: r && r.data } };
    } catch {}
  }
  try {
    const det = await axios.get(`${base}/${id}`);
    const norm = normalizeMc((det && det.data) || {});
    if (norm) return { norm, raw: { url: `${base}/${id}`, data: det && det.data } };
  } catch {}
  return { norm: null, raw: null };
}

export default function DetalheEntrevista() {
  const { id } = useParams();
  const location = useLocation();
  const fromState = (location && location.state) || {};

  const [flash, setFlash] = useState(fromState.flash || '');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [entrevista, setEntrevista] = useState(null);
  const [mcResumo, setMcResumo] = useState(fromState.mcResumo || null);
  const [mcRaw, setMcRaw] = useState(fromState.mcRaw || null);
  const [cacheInfo, setCacheInfo] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErro(null);

      if (fromState.mcResumo) saveMcLocal(id, fromState.mcResumo);

      let base = '/api/entrevistas';
      try {
        const e1 = await axios.get(`${base}/${id}`);
        if (!alive) return;
        setEntrevista((e1 && e1.data) || null);

        if (!mcResumo) {
          const mc = await tryGetMc(base, id);
          if (!alive) return;
          if (mc && mc.norm) {
            setMcResumo(mc.norm);
            saveMcLocal(id, mc.norm);
          } else {
            const cached = loadMcLocal(id);
            if (cached) {
              setMcResumo(cached.resumo);
              setCacheInfo(cached.savedAt);
            }
          }
        }
      } catch {
        base = '/api/Entrevistas';
        try {
          const e2 = await axios.get(`${base}/${id}`);
          if (!alive) return;
          setEntrevista((e2 && e2.data) || null);

          if (!mcResumo) {
            const mc = await tryGetMc(base, id);
            if (!alive) return;
            if (mc && mc.norm) {
              setMcResumo(mc.norm);
              saveMcLocal(id, mc.norm);
            } else {
              const cached = loadMcLocal(id);
              if (cached) {
                setMcResumo(cached.resumo);
                setCacheInfo(cached.savedAt);
              }
            }
          }
        } catch {
          if (!alive) return;
          setErro('Falha ao carregar entrevista.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setFlash(''), 4000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  if (loading) return <div className="p-4">Carregando...</div>;
  if (erro) return <div className="p-4 text-red-600">{erro}</div>;
  if (!entrevista) return <div className="p-4">Entrevista não encontrada.</div>;

  const pick = (obj, keys) => {
    for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    return undefined;
  };

  const esforcoPM = pick(entrevista, ['esforcoPM', 'esforco', 'pm', 'pessoaMes']);
  const duracaoMes = pick(entrevista, ['prazoMeses', 'duracao', 'tdev', 'prazo']);
  let pessoasNec = pick(entrevista, ['pessoasNecessarias', 'pessoas', 'avgPessoas', 'pessoasMedias']);
  if ((pessoasNec === undefined || pessoasNec === null) && Number(esforcoPM) > 0 && Number(duracaoMes) > 0) {
    pessoasNec = Number(esforcoPM) / Number(duracaoMes);
  }

  const tipoEntradaNum = pick(entrevista, ['tipoEntrada']);
  const tipoEntradaTxt = (typeof tipoEntradaNum === 'number')
    ? (tipoEntradaNum === 1 ? 'KLOC' : (tipoEntradaNum === 2 ? 'Pontos de Função' : String(tipoEntradaNum)))
    : (String(tipoEntradaNum || '') || '—');

  // JSON de resultado (para copiar/consultar/baixar)
  const resultadoJson = {
    entrevista: {
      nomeEntrevista: entrevista.nomeEntrevista || entrevista.nome || null,
      nomeEntrevistado: entrevista.nomeEntrevistado || null,
      nomeEntrevistador: entrevista.nomeEntrevistador || null,
      dataEntrevista: entrevista.dataEntrevista || null,
      linguagem: entrevista.linguagem || null,
      tipoEntrada: tipoEntradaTxt,
      kloc: entrevista.tamanhoKloc ?? entrevista.valorKloc ?? null,
      totalCFP: entrevista.totalCFP ?? entrevista.totalCfp ?? null,
    },
    cocomo: {
      esforcoPM: esforcoPM ?? null,
      prazoMeses: duracaoMes ?? null,
      pessoasNecessarias: pessoasNec ?? null,
    },
    monteCarlo: mcResumo || null,
  };
  const jsonStr = JSON.stringify(resultadoJson, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      alert('JSON copiado para a área de transferência.');
    } catch {
      alert('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {flash && (
        <div className="mb-3 p-3 rounded bg-green-100 text-green-900 border border-green-300">
          {flash}
        </div>
      )}

      <div className="mb-4">
        <Link to="/entrevistas" className="text-blue-700 underline text-sm">← Voltar para lista</Link>
      </div>

      <h2 className="text-2xl font-bold mb-4">Detalhe da Entrevista</h2>

      <div className="mb-4 p-4 border rounded">
        <div><b>Nome do processo:</b> {entrevista.nomeEntrevista || entrevista.nome || '—'}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <div><b>Entrevistador:</b> {entrevista.nomeEntrevistador || '—'}</div>
          <div><b>Entrevistado:</b> {entrevista.nomeEntrevistado || '—'}</div>
          <div><b>Linguagem:</b> {entrevista.linguagem || '—'}</div>
          <div><b>Tipo de Entrada:</b> {tipoEntradaTxt}</div>
          <div><b>Data:</b> {fmtDateBR(entrevista.dataEntrevista)}</div>
        </div>
      </div>

      <div className="mb-4 p-4 border rounded">
        <h3 className="font-semibold mb-2">Tamanho (COSMIC)</h3>
        <div><b>Total CFP:</b> {fmt(entrevista.totalCFP ?? entrevista.totalCfp ?? 0)}</div>
        <div><b>KLOC:</b> {fmt(entrevista.tamanhoKloc ?? entrevista.valorKloc ?? entrevista.kloc)}</div>
      </div>

      <div className="mb-4 p-4 border rounded">
        <h3 className="font-semibold mb-2">Resultado do COCOMO II</h3>
        <div><b>Esforço:</b> {fmt(esforcoPM)} pessoa-mês</div>
        <div><b>Duração:</b> {fmt(duracaoMes)} meses</div>
        <div><b>Pessoas necessárias:</b> {fmt(pessoasNec)}</div>
      </div>

      {mcResumo ? (
        <div className="mt-4 p-4 border rounded text-sm">
          <h3 className="font-semibold mb-2">Resultado Monte Carlo</h3>

          {cacheInfo && (
            <div className="mb-2 text-xs text-gray-600">
              Exibindo Monte Carlo do cache local (salvo em {new Date(cacheInfo).toLocaleString()}).
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Esforço (PM)</h4>
              <ul className="list-disc ml-5">
                <li>P10: {fmt(mcResumo.pm && mcResumo.pm.p10)}</li>
                <li>P50: {fmt(mcResumo.pm && mcResumo.pm.p50)}</li>
                <li>P90: {fmt(mcResumo.pm && mcResumo.pm.p90)}</li>
                <li>Média: {fmt(mcResumo.pm && mcResumo.pm.media)}</li>
                <li>Desvio: {fmt(mcResumo.pm && mcResumo.pm.dp)}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Prazo (meses)</h4>
              <ul className="list-disc ml-5">
                <li>P10: {fmt(mcResumo.tdev && mcResumo.tdev.p10)}</li>
                <li>P50: {fmt(mcResumo.tdev && mcResumo.tdev.p50)}</li>
                <li>P90: {fmt(mcResumo.tdev && mcResumo.tdev.p90)}</li>
                <li>Média: {fmt(mcResumo.tdev && mcResumo.tdev.media)}</li>
                <li>Desvio: {fmt(mcResumo.tdev && mcResumo.tdev.dp)}</li>
              </ul>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-700 leading-relaxed">
            <p><b>O que significam os percentis?</b></p>
            <ul className="list-disc ml-5">
              <li><b>P10</b>: 10% das simulações resultam em valores <i>menores ou iguais</i> a este (limite inferior conservador).</li>
              <li><b>P50</b>: mediana — metade das simulações ficam abaixo e metade acima (estimativa “central”).</li>
              <li><b>P90</b>: 90% das simulações ficam <i>abaixo ou iguais</i> a este valor (meta com alta confiança).</li>
              <li><b>Média</b>: média aritmética das simulações (sensível a valores extremos).</li>
              <li><b>Desvio</b>: desvio-padrão das simulações (mede a dispersão/risco).</li>
            </ul>
          </div>

          <div className="mt-4">
            <details>
              <summary className="cursor-pointer text-blue-700">Ver/baixar JSON do resultado</summary>
              <div className="mt-2">
                <button onClick={copyJson} className="text-xs bg-gray-800 text-white px-2 py-1 rounded mr-2">
                  Copiar JSON
                </button>
                <a
                  className="text-xs underline"
                  download={`resultado_${(entrevista.nomeEntrevista || 'entrevista').replace(/\s+/g,'_')}.json`}
                  href={`data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`}
                >
                  Baixar JSON
                </a>
              </div>
              <pre className="mt-2 bg-gray-100 p-2 rounded max-h-72 overflow-auto">
{jsonStr}
              </pre>
            </details>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-600">
          Nenhum resumo de Monte Carlo salvo para esta entrevista.
        </div>
      )}
    </div>
  );
}
