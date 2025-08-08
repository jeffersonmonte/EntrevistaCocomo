import { useEffect, useMemo, useState } from 'react';

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
 */
export default function CosmicInlineGrid({
  linguagem,
  onChange
}: {
  linguagem?: string | null;
  onChange?: (r:{ totalCFP:number; kloc:number }) => void;
}) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [novo, setNovo] = useState<Linha>({ nome:'', template:'Consulta', obs:'', ...TEMPLATES['Consulta'] });
  const [fator, setFator] = useState<number>(105); // fallback: 105 CFP/KLOC

  // Carrega fator de conversão conforme a linguagem
  useEffect(() => {
    let active = true;
    (async () => {
      const convs = await fetchConversoes();
      const matchSpecific = convs.find((c:any)=> c.tipoEntrada==='COSMIC' && (c.contexto?.toLowerCase?.() === (linguagem||'').toLowerCase()));
      const matchPadrao = convs.find((c:any)=> c.tipoEntrada==='COSMIC' && (!c.contexto || c.contexto === 'Padrão'));
      const fatorVal = matchSpecific?.fatorConversao ?? matchPadrao?.fatorConversao ?? 105;
      if (active) setFator(Number(fatorVal) || 105);
    })();
    return () => { active = false; };
  }, [linguagem]);

  const totalCFP = useMemo(()=>linhas.reduce((s,l)=>s + l.E + l.X + l.R + l.W, 0), [linhas]);
  const kloc = useMemo(()=> (fator > 0 ? +(totalCFP / fator).toFixed(3) : 0), [totalCFP, fator]);

  useEffect(()=>{
    onChange?.({ totalCFP, kloc });
  }, [totalCFP, kloc]);

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

      <div className="text-xs text-gray-600">
        Fator de conversão (CFP/KLOC): <b>{fator}</b> {linguagem ? `(linguagem: ${linguagem})` : '(padrão)'}
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
