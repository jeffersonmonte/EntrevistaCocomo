
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import CosmicInlineGrid from "./CosmicInlineGrid";
import { api } from "../lib/api"; // Axios client

type FormValues = {
  nomeEntrevista?: string;
  nomeEntrevistado?: string;
  nomeEntrevistador?: string;
  dataEntrevista?: string;
  linguagem?: string;
  tipoEntrada: number;     // 1=KLOC, 2=PF, 3=COSMIC
  valorKloc?: number;
  pontosDeFuncao?: number;
  scaleFactors: { nome: string; nivel: string; valor: number }[];
  effortMultipliers: { nome: string; nivel: string; valor: number }[];
};

const SCALE_FACTORS = ["PREC", "FLEX", "RESL", "TEAM", "PMAT"];
const EFFORT_MULTIPLIERS = ["RCPX", "RUSE", "PDIF", "PERS", "PREX", "FCIL", "SCED"];

const NIVEIS = [
  { label: "Muito Baixo", value: "MuitoBaixo" },
  { label: "Baixo", value: "Baixo" },
  { label: "Nominal", value: "Nominal" },
  { label: "Alto", value: "Alto" },
  { label: "Muito Alto", value: "MuitoAlto" }
];

const SF_INFO: Record<string,{nome:string,desc:string}> = {
  PREC: { nome: "Precedência do Projeto", desc: "Nível de experiência em projetos similares." },
  FLEX: { nome: "Flexibilidade de Processo", desc: "Liberdade para seguir processos diferentes." },
  RESL: { nome: "Resolução de Riscos", desc: "Maturidade da equipe em prever/tratar riscos." },
  TEAM: { nome: "Coesão da Equipe", desc: "Quão bem a equipe trabalha junta." },
  PMAT: { nome: "Maturidade do Processo", desc: "Nível de formalização de processos (baseado em CMMI)." }
};

const EM_INFO: Record<string,{nome:string,desc:string}> = {
  RCPX: { nome: "Complexidade do Produto", desc: "Algoritmos, interações, funcionalidades críticas." },
  RUSE: { nome: "Reusabilidade Requerida", desc: "O quanto o código precisa ser reutilizável." },
  PDIF: { nome: "Dificuldade da Plataforma", desc: "Restrições de SO, hardware, comunicação, etc." },
  PERS: { nome: "Capacidade da Equipe", desc: "Qualidade técnica dos desenvolvedores e analistas." },
  PREX: { nome: "Experiência da Equipe", desc: "Experiência com o domínio, tecnologia, ferramentas." },
  FCIL: { nome: "Apoio de Ferramentas", desc: "Ferramentas CASE, automações, frameworks." },
  SCED: { nome: "Pressão de Cronograma", desc: "Se o cronograma está apertado ou relaxado." }
};

async function fetchConversoes(): Promise<any[]> {
  try {
    const { data } = await api.get('/config/conversoes');
    return data;
  } catch {
    return [];
  }
}

export default function InterviewForm() {
  const navigate = useNavigate();

  const { register, handleSubmit, control, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      tipoEntrada: 1,
      valorKloc: undefined,
      pontosDeFuncao: undefined,
      scaleFactors: SCALE_FACTORS.map(nome => ({ nome, nivel: "Nominal", valor: 1 })),
      effortMultipliers: EFFORT_MULTIPLIERS.map(nome => ({ nome, nivel: "Nominal", valor: 1 }))
    }
  });

  const tipoEntrada = watch("tipoEntrada");
  const linguagem = watch("linguagem");
  const pontosDeFuncao = watch("pontosDeFuncao");
  const valorKloc = watch("valorKloc");

  const { fields: sfFields } = useFieldArray({ control, name: "scaleFactors" });
  const { fields: emFields } = useFieldArray({ control, name: "effortMultipliers" });

  // PF → KLOC: carrega fator por linguagem (KLOC/FP)
  const [pfFator, setPfFator] = useState<number>(0.05); // fallback 0.05 KLOC/FP
  useEffect(() => {
    let active = true;
    (async () => {
      const convs = await fetchConversoes();
      const match = convs.find((c:any)=> c.tipoEntrada==='PF' && (c.contexto?.toLowerCase?.() === (linguagem||'').toLowerCase()));
      const val = Number(match?.fatorConversao);
      if (active) setPfFator(Number.isFinite(val) && val>0 ? val : 0.05);
    })();
    return () => { active = false; };
  }, [linguagem]);

  // Atualiza valorKloc quando PF mudar
  useEffect(() => {
    if (tipoEntrada === 2) { // PF
      const pf = Number(pontosDeFuncao) || 0;
      const kloc = +(pf * pfFator).toFixed(3);
      setValue("valorKloc", kloc, { shouldDirty: true, shouldValidate: false });
    }
  }, [tipoEntrada, pontosDeFuncao, pfFator, setValue]);

  // estado para guardar o resumo do COSMIC (totalCFP e kloc)
  const [cosmicResumo, setCosmicResumo] = useState<{ totalCFP:number; kloc:number } | null>(null);

  // Handler para COSMIC grid
  const handleCosmicChange = (r:{ totalCFP:number; kloc:number }) => {
    if (tipoEntrada === 3) {
      setCosmicResumo({ totalCFP: r.totalCFP, kloc: r.kloc });
      setValue("valorKloc", r.kloc, { shouldDirty: true });
    }
  };

  // Monte Carlo controls
  const [mcEnabled, setMcEnabled] = useState<boolean>(false);
  const [mcIterations, setMcIterations] = useState<number>(10000);
  const [mcTriang, setMcTriang] = useState<{ min?: number; mode?: number; max?: number }>({});

  function somaSF(arr: {valor:number}[]) { return arr.reduce((s,it)=> s + (Number(it.valor)||0), 0); }
  function produtoEM(arr: {valor:number}[]) { return arr.reduce((p,it)=> p * (Number(it.valor)||1), 1); }

  const onSubmit = async (form: FormValues) => {
    try {
      // Agregados
      const sumSF = somaSF(form.scaleFactors || []);
      const prodEM = produtoEM(form.effortMultipliers || []);

      // Mapeia linguagem (COSMIC não usa linguagem)
      const linguagemFinal = form.tipoEntrada === 3 ? null : (form.linguagem || null);

      // Payload
      const payload: any = {
        nomeEntrevista: form.nomeEntrevista || form.nomeEntrevistado || "Entrevista",
        nomeEntrevistado: form.nomeEntrevistado || null,
        nomeEntrevistador: form.nomeEntrevistador || null,
        dataEntrevista: form.dataEntrevista || null,
        linguagem: linguagemFinal,
        tipoEntrada: form.tipoEntrada,      // 1=KLOC, 2=PF, 3=COSMIC
        tamanhoKloc: Number(form.valorKloc) || 0,
        totalCFP: form.tipoEntrada === 3 ? (cosmicResumo?.totalCFP || 0) : 0,
        somaScaleFactors: +sumSF.toFixed(2),
        produtoEffortMultipliers: +prodEM.toFixed(3),
        scaleFactors: form.scaleFactors,
        effortMultipliers: form.effortMultipliers,
        pontosDeFuncao: form.tipoEntrada === 2 ? (Number(form.pontosDeFuncao)||0) : null
      };

      // 1) Cria entrevista
      const { data: dto } = await api.post('/Entrevistas', payload);
      const id = dto?.id ?? dto?.Id;
      if (!id) {
        window.alert('Entrevista salva, mas não foi possível obter o ID.');
        return;
      }

      // 2) (Opcional) Monte Carlo
      if (mcEnabled) {
        const body = {
          enabled: true,
          iterations: Number(mcIterations) || 10000,
          klocMin: mcTriang.min ?? null,
          klocMode: mcTriang.mode ?? null,
          klocMax: mcTriang.max ?? null
        };
        // **Importante**: chamar APENAS este endpoint existente no backend
        const { data: mcRes } = await api.post(`/Entrevistas/${id}/cocomo/monte-carlo`, body);
        console.log('[MonteCarlo]', mcRes);
        window.alert('Monte Carlo executado com sucesso.');
      }

      // 3) Redireciona
      window.alert('Entrevista salva com sucesso!');
      navigate(`/entrevistas/${id}`);

    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      window.alert(status ? `Falha ao salvar (HTTP ${status}).` : 'Falha ao salvar entrevista.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Nova Entrevista</h2>

      <div className="grid grid-cols-1 gap-4">
        <label>
          Nome da Entrevista:
          <input {...register("nomeEntrevista")} className="input block w-full" placeholder="Ex.: Projeto X - Sprint 1" />
        </label>
        <label>
          Nome do Entrevistado:
          <input {...register("nomeEntrevistado")} className="input block w-full" />
        </label>
        <label>
          Nome do Entrevistador:
          <input {...register("nomeEntrevistador")} className="input block w-full" />
        </label>
        <label>
          Data da Entrevista:
          <input type="date" {...register("dataEntrevista")} className="input block w-full" />
        </label>

        {/* Tipo de entrada */}
        <label>
          Tipo de entrada:
          <select {...register("tipoEntrada", { valueAsNumber: true })} className="input block w-full">
            <option value={1}>KLOC (direto)</option>
            <option value={2}>Pontos de Função (PF)</option>
            <option value={3}>COSMIC (CFP)</option>
          </select>
        </label>

        {/* Linguagem: desabilitada quando COSMIC */}
        <label>
          Linguagem:
          <input {...register("linguagem")} className="input block w-full" disabled={tipoEntrada === 3} />
          {tipoEntrada === 3 && (
            <span className="text-xs text-gray-600">* COSMIC não varia por linguagem — o campo fica desabilitado.</span>
          )}
        </label>

        {/* KLOC direto */}
        {tipoEntrada === 1 && (
          <label>
            Valor KLOC:
            <input type="number" step="0.001" {...register("valorKloc", { valueAsNumber: true })} className="input block w-full" />
          </label>
        )}

        {/* PF → KLOC */}
        {tipoEntrada === 2 && (
          <div className="grid grid-cols-1 gap-2">
            <label>
              Pontos de Função (PF):
              <input type="number" step="1" {...register("pontosDeFuncao", { valueAsNumber: true })} className="input block w-full" />
            </label>
          </div>
        )}

        {/* COSMIC inline */}
        {tipoEntrada === 3 && (
          <div className="border rounded p-3">
            <CosmicInlineGrid linguagem={linguagem} onChange={handleCosmicChange} />
            <div className="mt-2 text-sm">KLOC estimado (COSMIC): <b>{valorKloc ?? 0}</b>{cosmicResumo ? ` — CFP: ${cosmicResumo.totalCFP}` : ''}</div>
          </div>
        )}

        {/* Monte Carlo */}
        <fieldset className="border rounded p-3">
          <legend className="text-sm font-semibold">Monte Carlo (opcional)</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={mcEnabled} onChange={e=>setMcEnabled(e.target.checked)} />
            Executar Monte Carlo após salvar
          </label>
          {mcEnabled && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <label className="text-sm">
                Iterações
                <input type="number" min={1000} step={1000} value={mcIterations} onChange={e=>setMcIterations(+e.target.value)} className="input block w-full" />
              </label>
              <label className="text-sm">
                KLOC mín (opcional)
                <input type="number" step="0.001" value={mcTriang.min ?? ''} onChange={e=>setMcTriang(s=>({...s, min: e.target.value===''?undefined:+e.target.value}))} className="input block w-full" />
              </label>
              <label className="text-sm">
                KLOC moda (opcional)
                <input type="number" step="0.001" value={mcTriang.mode ?? ''} onChange={e=>setMcTriang(s=>({...s, mode: e.target.value===''?undefined:+e.target.value}))} className="input block w-full" />
              </label>
              <label className="text-sm">
                KLOC máx (opcional)
                <input type="number" step="0.001" value={mcTriang.max ?? ''} onChange={e=>setMcTriang(s=>({...s, max: e.target.value===''?undefined:+e.target.value}))} className="input block w-full" />
              </label>
            </div>
          )}
        </fieldset>
      </div>

      <h3 className="text-lg font-semibold mt-6">Fatores de Escala (Scale Factors)</h3>
      {sfFields.map((field, index) => (
        <div key={field.id} className="mb-2 flex gap-2 items-center">
          <label className="w-48" title={SF_INFO[field.nome].desc}>
            {field.nome} - {SF_INFO[field.nome].nome}
          </label>
          <select {...register(`scaleFactors.${index}.nivel` as const)} className="input">
            {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
          <input type="number" step="0.01" {...register(`scaleFactors.${index}.valor` as const, { valueAsNumber: true })} className="input w-24" />
        </div>
      ))}

      <h3 className="text-lg font-semibold mt-6">Multiplicadores de Esforço (Effort Multipliers)</h3>
      {emFields.map((field, index) => (
        <div key={field.id} className="mb-2 flex gap-2 items-center">
          <label className="w-48" title={EM_INFO[field.nome].desc}>
            {field.nome} - {EM_INFO[field.nome].nome}
          </label>
          <select {...register(`effortMultipliers.${index}.nivel` as const)} className="input">
            {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
          <input type="number" step="0.01" {...register(`effortMultipliers.${index}.valor` as const, { valueAsNumber: true })} className="input w-24" />
        </div>
      ))}

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salvar Entrevista</button>
    </form>
  );
}
