
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MC_CACHE_PREFIX = 'mcResumo:';
const hasMcCache = (id) => {
  try { return !!localStorage.getItem(MC_CACHE_PREFIX + id); } catch { return false; }
};

function fmtDateBR(iso) {
  try {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('pt-BR'); // DD/MM/AAAA
  } catch {
    return String(iso || '—');
  }
}

export default function ListaEntrevistas() {
  const [items, setItems] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let base = '/api/entrevistas';
    async function load() {
      setLoading(true);
      setErro(null);
      try {
        const r = await axios.get(base);
        setItems((r && r.data) || []);
      } catch (e1) {
        base = '/api/Entrevistas';
        try {
          const r2 = await axios.get(base);
          setItems((r2 && r2.data) || []);
        } catch (e2) {
          setErro('Falha ao carregar entrevistas.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-4">Carregando...</div>;
  if (erro) return <div className="p-4 text-red-600">{erro}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">Entrevistas</h2>
        <Link to="/entrevistas/nova" className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">Nova</Link>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left px-3 py-2 w-28">Data</th>
              <th className="text-left px-3 py-2">Nome</th>
              <th className="text-left px-3 py-2 w-24">Linguagem</th>
              <th className="text-left px-3 py-2 w-28">KLOC</th>
              <th className="text-left px-3 py-2 w-28">PF</th>
              <th className="text-left px-3 py-2 w-28">MC</th>
              <th className="text-left px-3 py-2 w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const id = it.id || it.Id;
              const hasCache = hasMcCache(id);
              const kloc = it.tamanhoKloc ?? it.valorKloc ?? '—';
              const pf = it.pontosDeFuncao ?? it.pontos ?? '—';
              return (
                <tr key={id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{fmtDateBR(it.dataEntrevista)}</td>
                  <td className="px-3 py-2">{it.nomeEntrevista || it.nome || '—'}</td>
                  <td className="px-3 py-2">{it.linguagem || '—'}</td>
                  <td className="px-3 py-2">{kloc !== undefined ? kloc : '—'}</td>
                  <td className="px-3 py-2">{pf !== undefined ? pf : '—'}</td>
                  <td className="px-3 py-2">
                    {hasCache ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-600 inline-block" /> em cache
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/entrevistas/${id}`} className="text-blue-700 underline">Detalhes</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
