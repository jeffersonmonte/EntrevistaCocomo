
import React, { useEffect, useMemo, useState } from 'react';

type Linha = { id?: string; nome: string; template?: string; obs?: string; E:number; X:number; R:number; W:number; };

const TEMPLATES: Record<string,{E:number,X:number,R:number,W:number}> = {
  Consulta: { E:1, X:1, R:1, W:0 },
  Inclusao: { E:1, X:1, R:0, W:1 },
  Alteracao:{ E:1, X:1, R:1, W:1 },
  Exclusao: { E:1, X:0, R:1, W:1 },
};

async function fetchConversoes(): Promise<any[]> {
  try {
    const res = await fetch('/api/config/conversoes');
    if (!res.ok) throw new Error('Falha ao carregar conversões');
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Medição COSMIC inline (sem persistir ainda).
 * Calcula CFP e KLOC localmente e notifica o formulário via onChange.
 * Nota: COSMIC não varia por linguagem; este componente ignora linguagem para fator.
 */
export default function CosmicInlineGrid({
  linguagem,
  onChange
}: {
  linguagem?: string | null;
  onChange?: (r:{ totalCFP:number; kloc:number, cfpPorKloc:number, klocPorCfp:number, source:string }) => void;
}) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [novo, setNovo] = useState<Linha>({ nome:'', template:'Consulta', obs:'', ...TEMPLATES['Consulta'] });

  // Mantemos ambos para exibição e cálculo
  const [cfpPorKloc, setCfpPorKloc] = useState<number>(40);   // CFP/KLOC
  const [klocPorCfp, setKlocPorCfp] = useState<number>(1/40); // KLOC/CFP

  // Carrega fator COSMIC corretamente (sem filtrar por linguagem)
  useEffect(() => {
    let active = true;
    (async () => {
      const convs = await fetchConversoes();
      const geral  = convs.find((c:any)=> c.tipoEntrada==='COSMIC' && c.contexto === 'Geral');    // KLOC/CFP
      const padrao = convs.find((c:any)=> c.tipoEntrada==='COSMIC' && (c.contexto === 'Padrão' || !c.contexto)); // CFP/KLOC

      let kpc = 0.025, cpk = 40;
      if (geral && Number(geral.fatorConversao) > 0) {
        kpc = Number(geral.fatorConversao);
        cpk = 1 / kpc;
      } else if (padrao && Number(padrao.fatorConversao) > 0) {
        cpk = Number(padrao.fatorConversao);
        kpc = 1 / cpk;
      }
      if (active) {
        setKlocPorCfp(kpc);
        setCfpPorKloc(cpk);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalCFP = useMemo(()=>linhas.reduce((s,l)=>s + l.E + l.X + l.R + l.W, 0), [linhas]);
  const kloc = useMemo(()=> +(totalCFP * klocPorCfp).toFixed(3), [totalCFP, klocPorCfp]);

  useEffect(()=>{
    onChange?.({ totalCFP, kloc, cfpPorKloc, klocPorCfp, source: 'COSMIC' });
  }, [totalCFP, kloc, cfpPorKloc, klocPorCfp]);

  function aplicarTemplate(tpl:string) {
    const t = TEMPLATES[tpl] ?? {E:0,X:0,R:0,W:0};
    setNovo(n => ({ ...n, ...t, template: tpl }));
  }

  function adicionar() {
    if (!novo.nome.trim()) return;
    setLinhas(arr => [...arr, { ...novo }]);
    setNovo({ nome:'', template:'Consulta', obs:'', ...TEMPLATES['Consulta'] });
  }

  function remover(i:number) {
    setLinhas(arr => arr.filter((_,idx)=>idx!==i));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-3">
          <label className="text-xs">Nome</label>
          <input className="w-full border rounded px-2 py-1" value={novo.nome} onChange={e=>setNovo({...novo, nome:e.target.value})} />
        </div>
        <div className="col-span-2">
          <label className="text-xs">Template</label>
          <select className="w-full border rounded px-2 py-1" value={novo.template} onChange={e=>aplicarTemplate(e.target.value)}>
            {Object.keys(TEMPLATES).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-xs">E</label>
          <input type="number" min={0} className="w-full border rounded px-2 py-1" value={novo.E} onChange={e=>setNovo({...novo, E:+e.target.value})} />
        </div>
        <div className="col-span-1">
          <label className="text-xs">X</label>
          <input type="number" min={0} className="w-full border rounded px-2 py-1" value={novo.X} onChange={e=>setNovo({...novo, X:+e.target.value})} />
        </div>
        <div className="col-span-1">
          <label className="text-xs">R</label>
          <input type="number" min={0} className="w-full border rounded px-2 py-1" value={novo.R} onChange={e=>setNovo({...novo, R:+e.target.value})} />
        </div>
        <div className="col-span-1">
          <label className="text-xs">W</label>
          <input type="number" min={0} className="w-full border rounded px-2 py-1" value={novo.W} onChange={e=>setNovo({...novo, W:+e.target.value})} />
        </div>
        <div className="col-span-3">
          <label className="text-xs">Observações</label>
          <input className="w-full border rounded px-2 py-1" value={novo.obs} onChange={e=>setNovo({...novo, obs:e.target.value})} />
        </div>
        <div className="col-span-12">
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={adicionar}>Adicionar</button>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <div>Fator (CFP/KLOC): <b>{cfpPorKloc}</b> — equivalente (KLOC/CFP): <b>{klocPorCfp.toFixed(3)}</b></div>
        <div className="italic">* COSMIC não varia por linguagem (campo de linguagem é ignorado aqui).</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left">Funcionalidade</th>
              <th className="border px-2 py-1">Tpl</th>
              <th className="border px-2 py-1">E</th>
              <th className="border px-2 py-1">X</th>
              <th className="border px-2 py-1">R</th>
              <th className="border px-2 py-1">W</th>
              <th className="border px-2 py-1">CFP</th>
              <th className="border px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l,i)=>(
              <tr key={i}>
                <td className="border px-2 py-1">{l.nome}</td>
                <td className="border px-2 py-1 text-center">{l.template}</td>
                <td className="border px-2 py-1 text-center">{l.E}</td>
                <td className="border px-2 py-1 text-center">{l.X}</td>
                <td className="border px-2 py-1 text-center">{l.R}</td>
                <td className="border px-2 py-1 text-center">{l.W}</td>
                <td className="border px-2 py-1 text-center">{l.E + l.X + l.R + l.W}</td>
                <td className="border px-2 py-1 text-center">
                  <button className="text-red-600 text-xs" onClick={()=>remover(i)}>remover</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="border px-2 py-1" colSpan={6}>Total CFP</td>
              <td className="border px-2 py-1 text-center">{totalCFP}</td>
              <td className="border px-2 py-1"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-sm">
        KLOC estimado (inline): <b>{kloc}</b>
      </div>
    </div>
  );
}
