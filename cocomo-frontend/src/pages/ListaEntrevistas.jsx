// src/pages/ListaEntrevistas.jsx
import React, { useEffect, useState } from "react";
import { listarEntrevistas, excluirEntrevista } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function ListaEntrevistas() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function carregar() {
    setLoading(true);
    try {
      const data = await listarEntrevistas();
      setItens(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Confirma excluir esta entrevista? Essa ação não pode ser desfeita.")) return;
    await excluirEntrevista(id);
    await carregar();
  }

  function onEdit(id) {
    // Reuso do InterviewForm: /nova-entrevista?id=<GUID> (edição)
    navigate(`/nova-entrevista?id=${encodeURIComponent(id)}`);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Entrevistas</h1>
        <div className="flex gap-2">
          <Link to="/nova-entrevista" className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90">
            Nova entrevista
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : itens.length === 0 ? (
        <p>Nenhum registro.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Entrevistado</th>
                <th className="p-2 text-left">Entrevistador</th>
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-right">KLOC</th>
                <th className="p-2 text-right">PM</th>
                <th className="p-2 text-right">Meses</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="p-2">{x.nomeEntrevista}</td>
                  <td className="p-2">{x.nomeEntrevistado}</td>
                  <td className="p-2">{x.nomeEntrevistador}</td>
                  <td className="p-2">{new Date(x.dataEntrevista).toLocaleDateString()}</td>
                  <td className="p-2 text-right">{Number(x.tamanhoKloc || 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{Number(x.esforcoPM || 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{Number(x.prazoMeses || 0).toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <Link
                      to={`/entrevistas/${x.id}`}
                      className="px-2 py-1 text-slate-700 hover:underline"
                      title="Ver detalhes"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => onEdit(x.id)}
                      className="ml-2 px-2 py-1 text-blue-700 hover:underline"
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(x.id)}
                      className="ml-2 px-2 py-1 text-red-700 hover:underline"
                      title="Excluir"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
