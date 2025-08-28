// src/pages/EntrevistaForm.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { criarEntrevista, obterEntrevista, atualizarEntrevista } from "../lib/api";

export default function EntrevistaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [model, setModel] = useState(null);

  // campos do payload POST/PUT
  const [nomeEntrevista, setNomeEntrevista] = useState("");
  const [dataEntrevista, setDataEntrevista] = useState(new Date().toISOString());
  const [tipoEntrada, setTipoEntrada] = useState(1); // 0=COSMIC, 1=PF
  const [valorKloc, setValorKloc] = useState(0);
  const [pontosDeFuncao, setPontosDeFuncao] = useState(0);
  const [linguagem, setLinguagem] = useState("C#");
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [leitura, setLeitura] = useState(0);
  const [gravacao, setGravacao] = useState(0);

  // Valores default (Nominal) para SF/EM — você pode popular com combos depois.
  const [scaleFactors, setScaleFactors] = useState([
    { nome: "PREC", nivel: "Nominal", valor: 3.72 },
    { nome: "FLEX", nivel: "Nominal", valor: 3.04 },
    { nome: "RESL", nivel: "Nominal", valor: 4.24 },
    { nome: "TEAM", nivel: "Nominal", valor: 3.29 },
    { nome: "PMAT", nivel: "Nominal", valor: 4.68 },
  ]);

  const [effortMultipliers, setEffortMultipliers] = useState([
    { nome: "RCPX", nivel: "Nominal", valor: 1.0 },
    { nome: "RUSE", nivel: "Nominal", valor: 1.07 },
    { nome: "PDIF", nivel: "Nominal", valor: 1.29 },
    { nome: "PERS", nivel: "Nominal", valor: 1.0 },
    { nome: "PREX", nivel: "Nominal", valor: 1.0 },
    { nome: "FCIL", nivel: "Nominal", valor: 1.0 },
    { nome: "SCED", nivel: "Nominal", valor: 1.0 },
  ]);

  useEffect(() => {
    if (!isEdit) { setLoaded(true); return; }
    (async () => {
      const dto = await obterEntrevista(id);
      setModel(dto);
      setNomeEntrevista(dto.nomeEntrevista || "");
      setDataEntrevista(new Date(dto.dataEntrevista).toISOString());
      setTipoEntrada(dto.tipoEntrada ?? 1);
      setLinguagem(dto.linguagem || "");
      setLoaded(true);
    })();
  }, [id, isEdit]);

  async function onSubmit(e) {
    e.preventDefault();

    if (isEdit && model) {
      await atualizarEntrevista(model.id, {
        id: model.id,
        nomeEntrevista,
        dataEntrevista,
        tipoEntrada,
        linguagem,
      });
      navigate("/");
      return;
    }

    await criarEntrevista({
      nomeEntrevista,
      dataEntrevista,
      tipoEntrada,
      valorKloc,
      pontosDeFuncao,
      linguagem,
      entradas,
      saidas,
      leitura,
      gravacao,
      scaleFactors,
      effortMultipliers,
    });
    navigate("/");
  }

  const isCosmic = useMemo(() => Number(tipoEntrada) === 0, [tipoEntrada]);

  if (!loaded) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">
        {isEdit ? "Editar Entrevista" : "Nova Entrevista"}
      </h1>

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
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span>Tipo de entrada</span>
            <select className="border rounded p-2" value={tipoEntrada} onChange={e=>setTipoEntrada(e.target.value)}>
              <option value={0}>COSMIC</option>
              <option value={1}>Pontos de Função</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span>Linguagem (se PF)</span>
            <input className="border rounded p-2" value={linguagem} onChange={e=>setLinguagem(e.target.value)} placeholder="C#, Java, etc." />
          </label>

          <label className="grid gap-1">
            <span>Valor KLOC (opcional)</span>
            <input type="number" step="0.01" className="border rounded p-2" value={valorKloc} onChange={e=>setValorKloc(Number(e.target.value))} />
          </label>
        </div>

        {Number(tipoEntrada) === 1 && (
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1">
              <span>Pontos de Função</span>
              <input type="number" className="border rounded p-2" value={pontosDeFuncao} onChange={e=>setPontosDeFuncao(Number(e.target.value))}/>
            </label>
          </div>
        )}

        <fieldset className="border rounded p-3">
          <legend className="px-2 text-sm font-medium">COSMIC (E/X/R/W)</legend>
          <div className="grid sm:grid-cols-4 gap-3">
            <label className="grid gap-1">
              <span>Entradas (E)</span>
              <input type="number" className="border rounded p-2" value={entradas} onChange={e=>setEntradas(Number(e.target.value))}/>
            </label>
            <label className="grid gap-1">
              <span>Saídas (X)</span>
              <input type="number" className="border rounded p-2" value={saidas} onChange={e=>setSaidas(Number(e.target.value))}/>
            </label>
            <label className="grid gap-1">
              <span>Leitura (R)</span>
              <input type="number" className="border rounded p-2" value={leitura} onChange={e=>setLeitura(Number(e.target.value))}/>
            </label>
            <label className="grid gap-1">
              <span>Gravação (W)</span>
              <input type="number" className="border rounded p-2" value={gravacao} onChange={e=>setGravacao(Number(e.target.value))}/>
            </label>
          </div>
          {isCosmic && <p className="text-xs text-gray-500 mt-2">Para detalhar por funcionalidade, use “Nova (com COSMIC detalhado)”.</p>}
        </fieldset>

        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90" type="submit">
            {isEdit ? "Salvar alterações" : "Criar entrevista"}
          </button>
          <button className="px-4 py-2 rounded border" type="button" onClick={()=>navigate("/")}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
