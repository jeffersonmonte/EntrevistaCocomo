import { useMemo, useState } from 'react';
import { getFuncionalidades, postFuncionalidade, postRecalcular } from '../services/entrevistas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const TEMPLATES: Record<string,{E:number,X:number,R:number,W:number}> = {
  Consulta: { E:1, X:1, R:1, W:0 },
  Inclusao: { E:1, X:1, R:0, W:1 },
  Alteracao:{ E:1, X:1, R:1, W:1 },
  Exclusao: { E:1, X:0, R:1, W:1 },
};

type Linha = { id?: string; nome: string; template?: string; obs?: string; E:number; X:number; R:number; W:number; };

export default function CosmicGrid({ entrevistaId, onRecalc }: { entrevistaId: string; onRecalc?: (r:{totalCFP:number; kloc:number})=>void; }) {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [novo, setNovo] = useState<Linha>({ nome:'', template:'Consulta', obs:'', ...TEMPLATES['Consulta'] });

  const totalCFP = useMemo(()=>linhas.reduce((s,l)=>s + l.E + l.X + l.R + l.W, 0), [linhas]);

  async function carregar() {
    const data = await getFuncionalidades(entrevistaId);
    const items: Linha[] = data.map((d:any)=>({ id:d.id, nome:d.nome, template:d.template, obs:d.observacoes, E:d.e, X:d.x, R:d.r, W:d.w }));
    setLinhas(items);
  }

  function aplicarTemplate(tpl:string) {
    const t = TEMPLATES[tpl] ?? {E:0,X:0,R:0,W:0};
    setNovo(n => ({ ...n, ...t, template: tpl }));
  }

  async function adicionar() {
    if (!novo.nome.trim()) return;
    const payload = { nome: novo.nome, template: novo.template, observacoes: novo.obs, medicao: { E: novo.E, X: novo.X, R: novo.R, W: novo.W } };
    await postFuncionalidade(entrevistaId, payload);
    await carregar();
    setNovo({ nome:'', template:'Consulta', obs:'', ...TEMPLATES['Consulta'] });
  }

  async function recalcular() {
    const r = await postRecalcular(entrevistaId); // { totalCFP, kloc }
    onRecalc?.(r);
  }

  function exportar(tipo:'csv'|'xlsx') {
    const rows = linhas.map(l => ({ Funcionalidade: l.nome, Template: l.template, E:l.E, X:l.X, R:l.R, W:l.W, CFP: l.E+l.X+l.R+l.W }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'COSMIC');
    const data = XLSX.write(wb, { bookType: tipo, type: 'array' });
    const mime = tipo === 'xlsx' ? 'application/octet-stream' : 'text/csv;charset=utf-8;';
    saveAs(new Blob([data], { type: mime }), `cosmic_${entrevistaId}.${tipo}`);
  }

  // carregar on mount
  if (linhas.length === 0) {
    void carregar();
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
            </tr>
          </thead>
          <tbody>
            {linhas.map((l,i)=>(
              <tr key={l.id ?? i}>
                <td className="border px-2 py-1">{l.nome}</td>
                <td className="border px-2 py-1 text-center">{l.template}</td>
                <td className="border px-2 py-1 text-center">{l.E}</td>
                <td className="border px-2 py-1 text-center">{l.X}</td>
                <td className="border px-2 py-1 text-center">{l.R}</td>
                <td className="border px-2 py-1 text-center">{l.W}</td>
                <td className="border px-2 py-1 text-center">{l.E + l.X + l.R + l.W}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="border px-2 py-1" colSpan={6}>Total CFP</td>
              <td className="border px-2 py-1 text-center">{totalCFP}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-2">
        <button className="bg-emerald-600 text-white px-3 py-1 rounded" onClick={()=>exportar('csv')}>Exportar CSV</button>
        <button className="bg-amber-600 text-white px-3 py-1 rounded" onClick={()=>exportar('xlsx')}>Exportar XLSX</button>
        <button className="bg-slate-700 text-white px-3 py-1 rounded" onClick={recalcular}>Recalcular CFP/KLOC</button>
      </div>
    </div>
  );
}
