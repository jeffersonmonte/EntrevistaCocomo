import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import CocomoChecklist from '../components/CocomoChecklist';
import CosmicInlineGrid from '../components/CosmicInlineGrid';

// Cache local para resumo do MC
const MC_CACHE_PREFIX = 'mcResumo:';
function saveMcLocal(id, resumoComMeta) {
  try {
    const payload = { resumo: resumoComMeta, savedAt: new Date().toISOString() };
    localStorage.setItem(MC_CACHE_PREFIX + id, JSON.stringify(payload));
  } catch {}
}

const InterviewForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [formData, setFormData] = useState({
    nomeEntrevistado: '',
    nomeEntrevistador: '',
    dataEntrevista: '',
    tipoEntrada: 1, // 1=KLOC, 2=PF
    valorKloc: 0,
    pontosDeFuncao: 0,
    linguagem: '',
    entradas: 0,
    saidas: 0,
    leitura: 0,
    gravacao: 0,
    scaleFactors: [],       // [{ nome, nivel, valor }]
    effortMultipliers: [],  // [{ nome, nivel, valor }]
    nomeEntrevista: '',
  });

  const isKloc =
    formData &&
    (formData.tipoEntrada === 1 ||
      (typeof formData.tipoEntrada === 'string' &&
        String(formData.tipoEntrada).toUpperCase() === 'KLOC'));

  const [fatoresConversao, setFatoresConversao] = useState([]);
  const [resumo, setResumo] = useState({ totalCFP: 0, kloc: 0 });

  // ---- Monte Carlo (na própria InterviewForm) ----
  const [useMonteCarlo, setUseMonteCarlo] = useState(true);
  const [mcIterations, setMcIterations] = useState(10000);

  // modos: 'fixed' | 'percent' | 'tri'
  const [mcMode, setMcMode] = useState('percent');
  const [mcPerc, setMcPerc] = useState(20);
  const [klocMin, setKlocMin] = useState(0);
  const [klocMode, setKlocMode] = useState(0);
  const [klocMax, setKlocMax] = useState(0);
  const [triError, setTriError] = useState('');

  // Resultado de depuração inline
  const [mcResumo, setMcResumo] = useState(null);
  const [mcRaw, setMcRaw] = useState(null);
  const [mcShowRaw, setMcShowRaw] = useState(false);

  // --------- Carrega fatores (COSMIC/COCOMO) ---------
  useEffect(() => {
    axios
      .get('/api/fatores-conversao')
      .then((res) => {
        const data = res && res.data ? res.data : [];
        setFatoresConversao(data);
      })
      .catch(() => {});
  }, []);

  const agruparFatores = (tipo) => {
    const agrupados = {};
    fatoresConversao
      .filter((f) => f.tipoEntrada === tipo)
      .forEach((f) => {
        if (!agrupados[f.contexto]) {
          agrupados[f.contexto] = {
            nomeCompleto: f.nomeCompleto,
            descricao: f.descricao,
            niveis: [],
          };
        }
        agrupados[f.contexto].niveis.push({ nivel: f.nivel, valor: f.fatorConversao });
      });
    return agrupados;
  };

  const scaleFactorData = agruparFatores('ScaleFactor');
  const effortMultiplierData = agruparFatores('EffortMultiplier');

  // seleção atual para cada contexto
  const selectedNivel = (tipo, contexto) => {
    const list = tipo === 'ScaleFactor' ? formData.scaleFactors : formData.effortMultipliers;
    const found = (list || []).find((x) => x.nome === contexto);
    return found ? found.nivel : '';
  };

  const handleFatorChange = (tipo, contexto, nivel) => {
    const fator = fatoresConversao.find(
      (f) => f.tipoEntrada === tipo && f.contexto === contexto && f.nivel === nivel
    );
    const item = { nome: contexto, nivel, valor: fator ? fator.fatorConversao : 0 };
    setFormData((prev) => {
      const list = tipo === 'ScaleFactor' ? 'scaleFactors' : 'effortMultipliers';
      const atualizados = prev[list].filter((x) => x.nome !== contexto).concat(item);
      return { ...prev, [list]: atualizados };
    });
  };

  const extractIdFromResponse = (res) => {
    const d = res && res.data ? res.data : {};
    return (
      d.id ||
      d.Id ||
      d.entrevistaId ||
      d.interviewId ||
      (d.result && d.result.id) ||
      null
    );
  };

  // --------- NORMALIZADOR do retorno MC (flexível) ---------
  const normalizeMc = (payloadIn) => {
    if (payloadIn === undefined || payloadIn === null) return null;

    const tryParseFlatString = (s) => {
      const out = {};
      String(s)
        .split(/[;,|\n]/)
        .forEach((raw) => {
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
        if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
        else if (s.indexOf(',') >= 0) s = s.replace(',', '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    };

    const coerce = (o) => {
      if (!o) return {};
      const out = {};
      const set = (k, v) => {
        const n = num(v);
        if (n !== undefined) out[k] = n;
      };
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
      if (flat) obj = flat;
      else return null;
    }
    const root = obj.data || obj.result || obj.resultado || obj;

    // índice case-insensitive removendo _
    const ci = {};
    Object.keys(root || {}).forEach((k) => {
      ci[k.toLowerCase().replace(/_/g, '')] = root[k];
    });
    const val = (...keys) => {
      for (const k of keys) {
        if (root && root[k] !== undefined) return root[k];
        const lk = k.toLowerCase().replace(/_/g, '');
        if (ci[lk] !== undefined) return ci[lk];
      }
      return undefined;
    };

    // 1) objetos aninhados
    let pm = val('pm', 'esforco', 'esforcoPm', 'esforcoPM');
    let td = val('tdev', 'prazo', 'tdevMeses', 'duracaoMeses');

    if (Array.isArray(pm) && pm.length >= 3) pm = { p10: pm[0], p50: pm[1], p90: pm[2] };
    if (Array.isArray(td) && td.length >= 3) td = { p10: td[0], p50: td[1], p90: td[2] };

    if (pm || td) {
      const out1 = { pm: coerce(pm || {}), tdev: coerce(td || {}) };
      if (Number.isFinite(out1.pm.p50) || Number.isFinite(out1.tdev.p50)) return out1;
    }

    // 2) chaves planas
    const pmFlat = {
      p10: val('P10_PM', 'p10_PM', 'P10PM', 'p10pm', 'pmP10'),
      p50: val('P50_PM', 'p50_PM', 'P50PM', 'p50pm', 'pmP50'),
      p90: val('P90_PM', 'p90_PM', 'P90PM', 'p90pm', 'pmP90'),
      media: val('Media_PM', 'media_PM', 'MediaPM', 'mediapm', 'pmMedia'),
      dp: val('Desvio_PM', 'desvio_PM', 'Dp_PM', 'dp_PM', 'Std_PM', 'std_PM', 'pmDp', 'pmStd'),
      min: val('Min_PM', 'min_PM', 'pmMin'),
      max: val('Max_PM', 'max_PM', 'pmMax'),
    };
    const tdFlat = {
      p10: val('P10_TDEV', 'p10_TDEV', 'P10TDEV', 'p10tdev', 'tdevP10', 'prazoP10'),
      p50: val('P50_TDEV', 'p50_TDEV', 'P50TDEV', 'p50tdev', 'tdevP50', 'prazoP50'),
      p90: val('P90_TDEV', 'p90_TDEV', 'P90TDEV', 'p90tdev', 'tdevP90', 'prazoP90'),
      media: val('Media_TDEV', 'media_TDEV', 'MediaTDEV', 'mediatdev', 'tdevMedia', 'prazoMedia'),
      dp: val('Desvio_TDEV', 'desvio_TDEV', 'Dp_TDEV', 'dp_TDEV', 'Std_TDEV', 'std_TDEV', 'tdevDp', 'tdevStd', 'prazoDp'),
      min: val('Min_TDEV', 'min_TDEV', 'tdevMin'),
      max: val('Max_TDEV', 'max_TDEV', 'tdevMax'),
    };
    const out2 = { pm: coerce(pmFlat), tdev: coerce(tdFlat) };
    if (Number.isFinite(out2.pm.p50) || Number.isFinite(out2.tdev.p50)) return out2;

    // 3) fallback determinístico
    const pmDet = val('esforcoPM', 'esforco', 'pm', 'pessoaMes');
    const tdDet = val('prazoMeses', 'duracao', 'tdev', 'prazo');
    if (pmDet !== undefined || tdDet !== undefined) {
      return { pm: coerce({ p50: pmDet }), tdev: coerce({ p50: tdDet }) };
    }

    return null;
  };

  // --------- criação entrevista (fallback para rota com maiúscula) ---------
  const createEntrevista = async () => {
    try {
      const res = await axios.post('/api/entrevistas', formData);
      return { res, base: '/api/entrevistas' };
    } catch (e1) {
      const res2 = await axios.post('/api/Entrevistas', formData);
      return { res: res2, base: '/api/Entrevistas' };
    }
  };

  // --------- atualização (edição) ---------
  const updateEntrevista = async (id) => {
    const payload = { ...formData, id };
    const candidates = [`/api/entrevistas/${id}`, `/api/Entrevistas/${id}`];
    for (const url of candidates) {
      try {
        const r = await axios.put(url, payload);
        return { ok: r && (r.status === 204 || r.status === 200), url };
      } catch {}
    }
    return { ok: false };
  };

  // --------- carregar detalhes para edição ---------
  useEffect(() => {
    if (!editId) return;

    (async () => {
      try {
        let detail = null;
        try {
          const r = await axios.get(`/api/Entrevistas/${editId}/detalhe`);
          detail = r && r.data;
        } catch {
          const r2 = await axios.get(`/api/Entrevistas/${editId}`);
          detail = r2 && r2.data;
        }
        if (!detail) return;

        setFormData((prev) => ({
          ...prev,
          nomeEntrevista: detail.nomeEntrevista || '',
          nomeEntrevistado: detail.nomeEntrevistado || '',
          nomeEntrevistador: detail.nomeEntrevistador || '',
          dataEntrevista: (detail.dataEntrevista || '').slice(0, 10),
          tipoEntrada: detail.tipoEntrada ?? prev.tipoEntrada,
          linguagem: detail.linguagem ?? '',
          valorKloc: detail.tamanhoKloc ?? prev.valorKloc,
          entradas: detail.entradas ?? prev.entradas ?? 0,
          saidas: detail.saidas ?? prev.saidas ?? 0,
          leitura: detail.leitura ?? prev.leitura ?? 0,
          gravacao: detail.gravacao ?? prev.gravacao ?? 0,
          scaleFactors: detail.scaleFactors ?? prev.scaleFactors,
          effortMultipliers: detail.effortMultipliers ?? prev.effortMultipliers,
        }));
      } catch (e) {
        console.error('[Editar] Falha ao carregar detalhe', e);
      }
    })();
  }, [editId]);

  // --------- validação triangular ---------
  useEffect(() => {
    if (mcMode !== 'tri') {
      setTriError('');
      return;
    }
    if (!(klocMin <= klocMode && klocMode <= klocMax)) {
      setTriError('Garanta: Mín ≤ Mais provável ≤ Máx.');
    } else {
      setTriError('');
    }
  }, [mcMode, klocMin, klocMode, klocMax]);

  // --------- submit ---------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMcResumo(null);
    setMcRaw(null);

    // EDIÇÃO: apenas atualiza (sem MC aqui)
    if (editId) {
      const upd = await updateEntrevista(editId);
      if (!upd.ok) {
        alert('Falha ao atualizar entrevista.');
        return;
      }
      alert('Entrevista atualizada com sucesso!');
      navigate(`/entrevistas/${editId}`, { state: { flash: 'Entrevista atualizada com sucesso!' } });
      return;
    }

    // CRIAÇÃO + (opcional) MC persistido
    if (useMonteCarlo && mcMode === 'tri' && triError) {
      alert('Parâmetros triangulares inválidos. ' + triError);
      return;
    }

    try {
      const create = await createEntrevista();
      const res = create.res;
      const base = create.base;

      const ok = res && (res.status === 201 || res.status === 200);
      if (!ok) {
        alert('Entrevista salva, mas resposta inesperada do servidor.');
        return;
      }

      const id = extractIdFromResponse(res);
      if (!id) {
        alert('Entrevista salva, mas não foi possível identificar o ID.');
        return;
      }

      // sem MC → redireciona
      if (!useMonteCarlo) {
        alert('Entrevista salva com sucesso!');
        navigate(`/entrevistas/${id}`, { state: { flash: 'Entrevista salva com sucesso!' } });
        return;
      }

      // monta min/mode/max conforme o modo escolhido
      const baseKloc = Number(formData.valorKloc || resumo.kloc || 0) || 0;
      let a = baseKloc, b = baseKloc, c = baseKloc;
      if (mcMode === 'percent') {
        const p = Math.max(0, Number(mcPerc) || 0) / 100;
        a = Math.max(0, baseKloc * (1 - p));
        b = baseKloc;
        c = baseKloc * (1 + p);
      } else if (mcMode === 'tri') {
        a = Math.max(0, Number(klocMin) || 0);
        b = Math.max(0, Number(klocMode) || 0);
        c = Math.max(0, Number(klocMax) || 0);
      }

      // Executa e PERSISTE como “Atual” (overwrite=true)
      const mcBody = {
        enabled: true,
        iterations: Number.isFinite(+mcIterations) ? +mcIterations : 10000,
        klocMin: a,
        klocMode: b,
        klocMax: c,
      };

      // endpoint persistente
      const persistUrl = `${base}/${id}/cocomo/monte-carlo/persist?overwrite=true`;
      const persistRes = await axios.post(persistUrl, mcBody);

      setMcRaw({ step: 'persist', url: persistUrl, request: mcBody, response: persistRes?.data });

      const norm = normalizeMc(persistRes?.data || {});
      if (norm) {
        const model = { ...norm, _meta: { iterations: mcBody.iterations, a, b, c } };
        setMcResumo(model);
        saveMcLocal(id, model);
        alert('Entrevista salva + Monte Carlo persistido com sucesso!');
      } else {
        alert('Monte Carlo persistido, mas não foi possível normalizar o retorno.');
      }

      // segue para o detalhe
      navigate(`/entrevistas/${id}`, {
        state: {
          flash: 'Entrevista salva + Monte Carlo persistido!',
          mcResumo: norm,
          mcRaw: persistRes?.data,
        },
      });
    } catch (err) {
      console.error(err);
      alert('Falha ao salvar entrevista ou persistir Monte Carlo.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">{editId ? 'Editar Entrevista' : 'Nova Entrevista'}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="border-2 rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Medições COSMIC</h3>
            <p className="text-sm text-gray-600 mb-3">
              Preencha as funcionalidades abaixo; o <b>KLOC</b> será calculado automaticamente e
              preencherá o campo do formulário.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium">Linguagem para conversão (COSMIC)</label>
                <select
                  className="border-2 p-2 w-full"
                  value={formData.linguagem}
                  onChange={(e) => setFormData({ ...formData, linguagem: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="C#">C#</option>
                  <option value=".NET">.NET</option>
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="SQL">SQL</option>
                </select>
              </div>
            </div>

            <CosmicInlineGrid
              linguagem={formData.linguagem}
              onChange={({ totalCFP, kloc }) => {
                setResumo({ totalCFP, kloc });
                setFormData((prev) => ({ ...prev, valorKloc: kloc || 0 }));
                setKlocMin(kloc || 0);
                setKlocMode(kloc || 0);
                setKlocMax(kloc || 0);
              }}
            />

            <div className="mt-4 text-sm">
              <div> Total CFP (inline): <b>{resumo.totalCFP || 0}</b> </div>
              <div>
                KLOC (inline):{' '}
                <b>{resumo.kloc && resumo.kloc.toFixed ? resumo.kloc.toFixed(3) : resumo.kloc || 0}</b>
              </div>
            </div>
          </div>

          <br />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block">Nome da Entrevista</label>
              <input
                type="text"
                className="border-2 border-gray-300 p-2 w-full rounded"
                value={formData.nomeEntrevista}
                onChange={(e) => setFormData({ ...formData, nomeEntrevista: e.target.value })}
              />
            </div>

            <div>
              <label className="block">Nome do Entrevistado</label>
              <input
                type="text"
                className="border-2 p-2 w-full"
                value={formData.nomeEntrevistado}
                onChange={(e) => setFormData({ ...formData, nomeEntrevistado: e.target.value })}
              />
            </div>

            <div>
              <label className="block">Nome do Entrevistador</label>
              <input
                type="text"
                className="border-2 p-2 w-full"
                value={formData.nomeEntrevistador}
                onChange={(e) => setFormData({ ...formData, nomeEntrevistador: e.target.value })}
              />
            </div>

            <div>
              <label className="block">Data da Entrevista</label>
              <input
                type="date"
                className="border-2 p-2 w-full"
                value={formData.dataEntrevista}
                onChange={(e) => setFormData({ ...formData, dataEntrevista: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Tipo de Entrada</label>
                <select
                  className="border-2 p-2 w-full"
                  value={formData.tipoEntrada}
                  onChange={(e) => setFormData({ ...formData, tipoEntrada: parseInt(e.target.value, 10) })}
                >
                  <option value={1}>KLOC</option>
                  <option value={2}>Pontos de Função</option>
                </select>
              </div>

              <div>
                <label className="block">Valor KLOC</label>
                <input
                  type="number"
                  className="border-2 p-2 w-full"
                  value={formData.valorKloc}
                  disabled={!isKloc}
                  onChange={(e) => setFormData({ ...formData, valorKloc: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este campo é atualizado automaticamente pelas medições COSMIC abaixo.
                </p>
              </div>

              <div>
                <label className="block">Pontos de Função</label>
                <input
                  type="number"
                  className="border-2 p-2 w-full"
                  value={formData.pontosDeFuncao}
                  disabled={isKloc}
                  onChange={(e) => setFormData({ ...formData, pontosDeFuncao: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Monte Carlo */}
            <div className="mt-4 border-2 rounded p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Simulação Monte Carlo (opcional)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Para ver <b>P10/P90/Média/Desvio</b> e o efeito das <b>iterações</b>, inclua
                incerteza no KLOC.
              </p>

              <div className="flex items-center gap-3">
                <input
                  id="useMonteCarlo"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={useMonteCarlo}
                  onChange={(e) => setUseMonteCarlo(e.target.checked)}
                />
                <label htmlFor="useMonteCarlo" className="font-medium">
                  Calcular com Monte Carlo
                </label>
              </div>

              {useMonteCarlo && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label className="block">Iterações</label>
                      <input
                        type="number"
                        className="border-2 p-2 w-full"
                        min={1000}
                        step={1000}
                        value={mcIterations}
                        onChange={(e) => setMcIterations(parseInt(e.target.value || '0', 10))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mais iterações ↓ variância amostral (~1/√N).
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block font-medium">Incerteza no KLOC</label>

                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mcMode"
                          value="fixed"
                          checked={mcMode === 'fixed'}
                          onChange={() => setMcMode('fixed')}
                        />
                        <span>Valor fixo (sem incerteza)</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mcMode"
                          value="percent"
                          checked={mcMode === 'percent'}
                          onChange={() => setMcMode('percent')}
                        />
                        <span>±% ao redor do Valor KLOC</span>
                      </label>
                      {mcMode === 'percent' && (
                        <div className="pl-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="border-2 p-2 w-28"
                              min={0}
                              max={100}
                              value={mcPerc}
                              onChange={(e) => setMcPerc(parseFloat(e.target.value || '0'))}
                            />
                            <span className="text-sm text-gray-600">% (ex.: 20 = ±20%)</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Envia min = KLOC×(1−p), mode = KLOC, max = KLOC×(1+p).
                          </p>
                        </div>
                      )}

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mcMode"
                          value="tri"
                          checked={mcMode === 'tri'}
                          onChange={() => setMcMode('tri')}
                        />
                        <span>Triangular (Mín / Mais provável / Máx)</span>
                      </label>
                      {mcMode === 'tri' && (
                        <div className="pl-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm">KLOC Mín</label>
                            <input
                              type="number"
                              className="border-2 p-2 w-full"
                              value={klocMin}
                              onChange={(e) => setKlocMin(parseFloat(e.target.value || '0'))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm">KLOC Mais prov.</label>
                            <input
                              type="number"
                              className="border-2 p-2 w-full"
                              value={klocMode}
                              onChange={(e) => setKlocMode(parseFloat(e.target.value || '0'))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm">KLOC Máx</label>
                            <input
                              type="number"
                              className="border-2 p-2 w-full"
                              value={klocMax}
                              onChange={(e) => setKlocMax(parseFloat(e.target.value || '0'))}
                            />
                          </div>
                          {triError && (
                            <div className="sm:col-span-3 text-xs text-red-600">{triError}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Entradas</label>
                <input
                  type="number"
                  className="border-2 p-2 w-full"
                  value={formData.entradas}
                  onChange={(e) => setFormData({ ...formData, entradas: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block">Saídas</label>
                <input
                  type="number"
                  className="border-2 p-2 w-full"
                  value={formData.saidas}
                  onChange={(e) => setFormData({ ...formData, saidas: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block">Leituras</label>
                <input
                  type="number"
                  className="border-2 p-2 w-full"
                  value={formData.leitura}
                  onChange={(e) => setFormData({ ...formData, leitura: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block">Gravações</label>
                <input
                  type="number"
                  className="border-2 p-2 w-full"
                  value={formData.gravacao}
                  onChange={(e) => setFormData({ ...formData, gravacao: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <hr className="my-4" />
            <h3 className="text-xl font-semibold">Fatores de Escala</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(scaleFactorData).map(([contexto, dados]) => (
                <div key={contexto}>
                  <label className="block font-medium" title={dados.descricao}>
                    {contexto} - {dados.nomeCompleto}
                  </label>
                  <select
                    className="border-2 p-2 w-full"
                    value={selectedNivel('ScaleFactor', contexto) || ''}
                    onChange={(e) => handleFatorChange('ScaleFactor', contexto, e.target.value)}
                  >
                    <option value="">Selecione o nível</option>
                    {dados.niveis.map((n) => (
                      <option key={n.nivel} value={n.nivel}>
                        {n.nivel} ({n.valor})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mt-8">Multiplicadores de Esforço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(effortMultiplierData).map(([contexto, dados]) => (
                <div key={contexto}>
                  <label className="block font-medium" title={dados.descricao}>
                    {contexto} - {dados.nomeCompleto}
                  </label>
                  <select
                    className="border-2 p-2 w-full"
                    value={selectedNivel('EffortMultiplier', contexto) || ''}
                    onChange={(e) => handleFatorChange('EffortMultiplier', contexto, e.target.value)}
                  >
                    <option value="">Selecione o nível</option>
                    {dados.niveis.map((n) => (
                      <option key={n.nivel} value={n.nivel}>
                        {n.nivel} ({n.valor})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Resultado Monte Carlo inline */}
            {mcResumo &&
              (Number.isFinite(mcResumo.pm && mcResumo.pm.p50) ||
                Number.isFinite(mcResumo.tdev && mcResumo.tdev.p50)) && (
                <div className="mt-6 border rounded p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Resultado Monte Carlo</h4>
                    {mcResumo._meta && (
                      <span className="text-xs text-gray-600">
                        {`Iterações: ${mcResumo._meta.iterations} | KLOC[min,mode,max]=[${mcResumo._meta.a.toFixed(
                          3
                        )}, ${mcResumo._meta.b.toFixed(3)}, ${mcResumo._meta.c.toFixed(3)}]`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-1">Esforço (PM)</h5>
                      <ul className="list-disc ml-5">
                        <li>P10: {fmt(mcResumo.pm && mcResumo.pm.p10)}</li>
                        <li>P50: {fmt(mcResumo.pm && mcResumo.pm.p50)}</li>
                        <li>P90: {fmt(mcResumo.pm && mcResumo.pm.p90)}</li>
                        <li>Média: {fmt(mcResumo.pm && mcResumo.pm.media)}</li>
                        <li>Desvio: {fmt(mcResumo.pm && mcResumo.pm.dp)}</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Prazo (meses)</h5>
                      <ul className="list-disc ml-5">
                        <li>P10: {fmt(mcResumo.tdev && mcResumo.tdev.p10)}</li>
                        <li>P50: {fmt(mcResumo.tdev && mcResumo.tdev.p50)}</li>
                        <li>P90: {fmt(mcResumo.tdev && mcResumo.tdev.p90)}</li>
                        <li>Média: {fmt(mcResumo.tdev && mcResumo.tdev.media)}</li>
                        <li>Desvio: {fmt(mcResumo.tdev && mcResumo.tdev.dp)}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            {/* Depuração */}
            {mcRaw && (
              <div className="mt-3 text-xs">
                <button
                  type="button"
                  className="text-blue-700 underline"
                  onClick={() => setMcShowRaw(!mcShowRaw)}
                >
                  {mcShowRaw ? 'Ocultar JSON' : 'Ver JSON bruto do MC'}
                </button>
                {mcShowRaw && (
                  <pre className="mt-2 bg-gray-100 p-2 rounded max-h-64 overflow-auto">
                    {safeStringify(mcRaw)}
                  </pre>
                )}
              </div>
            )}

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-4">
              {editId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </form>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <CocomoChecklist />
          </div>
        </aside>
      </div>
    </div>
  );
};

function fmt(v) {
  if (v === undefined || v === null || Number.isNaN(+v)) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}
function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default InterviewForm;
