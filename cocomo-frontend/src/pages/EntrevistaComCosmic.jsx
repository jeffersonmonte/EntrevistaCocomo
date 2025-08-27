// src/pages/EntrevistaComCosmic.jsx
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { criarEntrevistaComCosmic } from "../lib/api";

export default function EntrevistaComCosmic() {
  const navigate = useNavigate();

  const [nomeEntrevista, setNomeEntrevista] = useState("");
  const [nomeEntrevistado, setNomeEntrevistado] = useState("");
  const [nomeEntrevistador, setNomeEntrevistador] = useState("");
  const [dataEntrevista, setDataEntrevista] = useState(new Date().toISOString());

  // 0 = COSMIC (exigido neste endpoint)
  const tipoEntrada = 0;

  // Fatores (defaults Nominal — ajuste depois com selects se quiser)
  const [scaleFactors] = useState([
    { nome: "PREC", nivel: "Nominal", valor: 3.72 },
    { nome: "FLEX", nivel: "Nominal", valor: 3.04 },
    { nome: "RESL", nivel: "Nominal", valor: 4.24 },
    { nome: "TEAM", nivel: "Nominal", valor: 3.29 },
    { nome: "PMAT", nivel: "Nominal", valor: 4.68 },
  ]);
  const [effortMultipliers] = useState([
    { nome: "RCPX", nivel: "Nominal", valor: 1.0 },
    { nome: "RUSE", nivel: "Nominal", valor: 1.07 },
    { nome: "PDIF", nivel: "Nominal", valor: 1.29 },
    { nome: "PERS", nivel: "Nominal", valor: 1.0 },
    { nome: "PREX", nivel: "Nominal", valor: 1.0 },
    { nome: "FCIL", nivel: "Nominal", valor: 1.0 },
    { nome: "SCED", nivel: "Nominal", valor: 1.0 },
  ]);

  const [funcionalidades, setFuncionalidades] = useState([
    { nome: "", template: "", observacoes: "", e: 0, x: 0, r: 0, w: 0 },
  ]);

  function addFunc() {
    setFuncionalidades((prev) => [...prev, { nome: "", template: "", observacoes: "", e: 0, x: 0, r: 0, w: 0 }]);
  }
  function updFunc(idx, field, value) {
    setFuncionalidades((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  }
  function rmFunc(idx) {
    setFuncionalidades((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();

    const payload = {
      nomeEntrevista,
      nomeEntrevistado,
      nomeEntrevistador,
      dataEntrevista,
      tipoEntrada,
      valorKloc: 0,
      pontosDeFuncao: 0,
      linguagem: null,
      entradas: 0,
      saidas: 0,
      leitura: 0,
      gravacao: 0,
      scaleFactors,
      effortMultipliers,
      funcionalidades,
    };

    await criarEntrevistaComCosmic(payload);
    navigate("/");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Nova Entrevista (COSMIC detalhado)</h1>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span>Nome da entrevista</span>
            <input className="border rounded p-2" value={nomeEntrevista} onChange={e=>setNomeEntrevista(e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span>Data</span>
            <input
              type="datetime-local"
              className="border rounded p-2"
              value={new Date(dataEntrevista).toISOString().slice(0,16)}
              onChange={e => setDataEntrevista(new Date(e.target.value).toISOString())}
              required
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span>Entrevistado</span>
            <input className="border rounded p-2" value={nomeEntrevistado} onChange={e=>setNomeEntrevistado(e.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span>Entrevistador</span>
            <input className="border rounded p-2" value={nomeEntrevistador} onChange={e=>setNomeEntrevistador(e.target.value)} required />
          </label>
        </div>

        <fieldset className="border rounded p-3">
          <legend className="px-2 text-sm font-medium">Funcionalidades (E/X/R/W por item)</legend>

          <div className="grid gap-6">
            {funcionalidades.map((f, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="grid gap-1">
                    <span>Nome</span>
                    <input className="border rounded p-2" value={f.nome} onChange={e=>updFunc(idx,"nome",e.target.value)} required />
                  </label>
                  <label className="grid gap-1">
                    <span>Template</span>
                    <input className="border rounded p-2" value={f.template} onChange={e=>updFunc(idx,"template",e.target.value)} placeholder="Opcional" />
                  </label>
                </div>

                <label className="grid gap-1 mt-3">
                  <span>Observações</span>
                  <textarea className="border rounded p-2" value={f.observacoes} onChange={e=>updFunc(idx,"observacoes",e.target.value)} />
                </label>

                <div className="grid sm:grid-cols-4 gap-3 mt-3">
                  <label className="grid gap-1">
                    <span>E</span>
                    <input type="number" className="border rounded p-2" value={f.e} onChange={e=>updFunc(idx,"e",Number(e.target.value))}/>
                  </label>
                  <label className="grid gap-1">
                    <span>X</span>
                    <input type="number" className="border rounded p-2" value={f.x} onChange={e=>updFunc(idx,"x",Number(e.target.value))}/>
                  </label>
                  <label className="grid gap-1">
                    <span>R</span>
                    <input type="number" className="border rounded p-2" value={f.r} onChange={e=>updFunc(idx,"r",Number(e.target.value))}/>
                  </label>
                  <label className="grid gap-1">
                    <span>W</span>
                    <input type="number" className="border rounded p-2" value={f.w} onChange={e=>updFunc(idx,"w",Number(e.target.value))}/>
                  </label>
                </div>

                <div className="flex justify-end mt-3">
                  <button type="button" onClick={()=>rmFunc(idx)} className="text-red-700 hover:underline">Remover</button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addFunc} className="mt-3 px-3 py-2 rounded border">
            + Adicionar funcionalidade
          </button>
        </fieldset>

        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:opacity-90" type="submit">
            Criar entrevista com COSMIC
          </button>
          <button className="px-4 py-2 rounded border" type="button" onClick={()=>navigate("/")}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
