import { useEffect, useState } from 'react';
import type { Entrevista } from '../types';

type Props = {
  value: Entrevista;
  onChange: (next: Entrevista) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export default function InterviewForm({ value, onChange, onSubmit, submitting }: Props) {
  const [local, setLocal] = useState<Entrevista>(value);

  useEffect(() => { setLocal(value); }, [value]);

  function set<K extends keyof Entrevista>(key: K, v: Entrevista[K]) {
    const next = { ...local, [key]: v };
    setLocal(next);
    onChange(next);
  }

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="form-grid">
        <div className="col-6">
          <label>Nome da Entrevista</label>
          <input className="input" value={local.nomeEntrevista ?? ''}
            onChange={(e)=>set('nomeEntrevista', e.target.value)} required />
        </div>
        <div className="col-6">
          <label>Data</label>
          <input className="input" type="date"
            value={(local.dataEntrevista || '').slice(0,10)}
            onChange={(e)=>set('dataEntrevista', e.target.value)} required />
        </div>

        <div className="col-6">
          <label>Entrevistado</label>
          <input className="input" value={local.nomeEntrevistado ?? ''}
            onChange={(e)=>set('nomeEntrevistado', e.target.value)} required />
        </div>
        <div className="col-6">
          <label>Entrevistador</label>
          <input className="input" value={local.nomeEntrevistador ?? ''}
            onChange={(e)=>set('nomeEntrevistador', e.target.value)} required />
        </div>

        <div className="col-6">
          <label>Tipo de Entrada</label>
          <select className="select" value={Number(local.tipoEntrada ?? 0)}
            onChange={(e)=>set('tipoEntrada', Number(e.target.value) as any)}>
            <option value={0}>COSMIC</option>
            <option value={1}>PF</option>
          </select>
        </div>

        <div className="col-6">
          <label>Linguagem (se PF)</label>
          <input className="input" value={local.linguagem ?? ''} placeholder="Ex.: C#, Java, etc."
            onChange={(e)=>set('linguagem', e.target.value || null)} />
        </div>

        <div className="col-12">
          <div className="hint">Campos calculados (somente leitura)</div>
        </div>

        <div className="col-3 col-6">
          <label>Total CFP</label>
          <input className="input" value={String(local.totalCFP ?? '')} disabled />
        </div>
        <div className="col-3 col-6">
          <label>KLOC</label>
          <input className="input" value={String(local.tamanhoKloc ?? '')} disabled />
        </div>
        <div className="col-3 col-6">
          <label>Esforço (PM)</label>
          <input className="input" value={String(local.esforcoPM ?? '')} disabled />
        </div>
        <div className="col-3 col-6">
          <label>Prazo (Meses)</label>
          <input className="input" value={String(local.prazoMeses ?? '')} disabled />
        </div>
      </div>

      <div className="row" style={{justifyContent:'flex-end', marginTop:12}}>
        <button className="button ghost" type="button" onClick={()=>history.back()} aria-label="Voltar">Voltar</button>
        <button className="button" type="submit" disabled={submitting} aria-label="Salvar">Salvar</button>
      </div>
    </form>
  );
}
