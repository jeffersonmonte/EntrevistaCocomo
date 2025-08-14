import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CocomoChecklist from '../components/CocomoChecklist';
import CosmicInlineGrid from '../components/CosmicInlineGrid';

const InterviewForm = () => {
  const [formData, setFormData] = useState({
    nomeEntrevistado: '',
    nomeEntrevistador: '',
    dataEntrevista: '',
    tipoEntrada: 1,
    valorKloc: 0,
    pontosDeFuncao: 0,
    linguagem: '',
    entradas: 0,
    saidas: 0,
    leitura: 0,
    gravacao: 0,
    scaleFactors: [],
    effortMultipliers: [],
  });

  const [fatoresConversao, setFatoresConversao] = useState([]);
  const [resumo, setResumo] = useState({ totalCFP: 0, kloc: 0 });

  useEffect(() => {
    axios.get('/api/fatores-conversao').then((res) => setFatoresConversao(res.data));
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

  const handleFatorChange = (tipo, contexto, nivel) => {
    const fator = fatoresConversao.find(
      (f) => f.tipoEntrada === tipo && f.contexto === contexto && f.nivel === nivel
    );

    const item = {
      nome: contexto,
      nivel,
      valor: fator ? fator.fatorConversao : 0,
    };

    setFormData((prev) => {
      const list = tipo === 'ScaleFactor' ? 'scaleFactors' : 'effortMultipliers';
      const atualizados = prev[list].filter((x) => x.nome !== contexto).concat(item);
      return { ...prev, [list]: atualizados };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/Entrevistas', formData);
      if (res?.status === 201 || res?.status === 200) {
        alert('Entrevista salva com sucesso!');
      } else {
        alert('Entrevista salva, mas resposta inesperada do servidor.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao salvar entrevista.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Nova Entrevista</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <br />
           <div className="mt-8 border rounded p-4">
            <h3 className="text-lg font-semibold mb-2">Medições COSMIC</h3>
            <p className="text-sm text-gray-600 mb-3">
              Preencha as funcionalidades abaixo; o <b>KLOC</b> será calculado automaticamente e preencherá o campo do formulário.
            </p>

            <CosmicInlineGrid
              linguagem={formData.linguagem}
              onChange={({ totalCFP, kloc }) => {
                setResumo({ totalCFP, kloc });
                setFormData((prev) => ({ ...prev, valorKloc: kloc ?? 0 }));
              }}
            />

            <div className="mt-4 text-sm">
              <div>Total CFP (inline): <b>{resumo.totalCFP ?? 0}</b></div>
              <div>KLOC (inline): <b>{(resumo.kloc ?? 0).toFixed ? (resumo.kloc ?? 0).toFixed(3) : resumo.kloc}</b></div>
            </div>
          </div>
          <br />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block">Nome do Entrevistado</label>
              <input type="text" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, nomeEntrevistado: e.target.value })} />
            </div>

            <div>
              <label className="block">Nome do Entrevistador</label>
              <input type="text" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, nomeEntrevistador: e.target.value })} />
            </div>

            <div>
              <label className="block">Data da Entrevista</label>
              <input type="date" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, dataEntrevista: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Tipo de Entrada</label>
                <select className="border p-2 w-full" value={formData.tipoEntrada} onChange={(e) => setFormData({ ...formData, tipoEntrada: parseInt(e.target.value) })}>
                  <option value={1}>KLOC</option>
                  <option value={2}>Pontos de Função</option>
                </select>
              </div>
              <div>
                <label className="block">Valor KLOC</label>
                <input type="number" className="border p-2 w-full" value={formData.valorKloc} onChange={(e) => setFormData({ ...formData, valorKloc: parseFloat(e.target.value) })} />
                <p className="text-xs text-gray-500 mt-1">Este campo é atualizado automaticamente pelas medições COSMIC abaixo.</p>
              </div>
              <div>
                <label className="block">Pontos de Função</label>
                <input type="number" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, pontosDeFuncao: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block">Linguagem</label>
                <input type="text" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, linguagem: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Entradas</label>
                <input type="number" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, entradas: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block">Saídas</label>
                <input type="number" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, saidas: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block">Leituras</label>
                <input type="number" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, leitura: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block">Gravações</label>
                <input type="number" className="border p-2 w-full" onChange={(e) => setFormData({ ...formData, gravacao: parseFloat(e.target.value) })} />
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
                  <select className="border p-2 w-full" onChange={(e) => handleFatorChange('ScaleFactor', contexto, e.target.value)}>
                    <option value="">Selecione o nível</option>
                    {dados.niveis.map((n) => (
                      <option key={n.nivel} value={n.nivel}>{n.nivel} ({n.valor})</option>
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
                  <select className="border p-2 w-full" onChange={(e) => handleFatorChange('EffortMultiplier', contexto, e.target.value)}>
                    <option value="">Selecione o nível</option>
                    {dados.niveis.map((n) => (
                      <option key={n.nivel} value={n.nivel}>{n.nivel} ({n.valor})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Salvar</button>
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

export default InterviewForm;
