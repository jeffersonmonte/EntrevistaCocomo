import Loader from '../components/Loader';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ListaEntrevistas = () => {
  const [entrevistas, setEntrevistas] = useState([]);
  const [loading, setLoading] = useState(true);

  const exportar = (tipo) => {
    const rows = entrevistas.map(e => ({
      Entrevistado: e.nomeEntrevistado,
      Entrevistador: e.nomeEntrevistador,
      Data: e.dataEntrevista ? new Date(e.dataEntrevista).toLocaleDateString('pt-BR') : '',
      Linguagem: e.linguagem ?? '-',
      TotalCFP: e.totalCFP ?? 0,
      KLOC: e.tamanhoKloc ?? 0,
      EsforcoPM: e.esforcoPM ?? 0,
      PrazoMeses: e.prazoMeses ?? 0
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entrevistas');
    const data = XLSX.write(wb, { bookType: tipo, type: 'array' });
    const mime = tipo === 'xlsx' ? 'application/octet-stream' : 'text/csv;charset=utf-8;';
    saveAs(new Blob([data], { type: mime }), `entrevistas.${tipo}`);
  };


  useEffect(() => { setLoading(true);
    axios.get('/api/Entrevistas')
      .then((res) => setEntrevistas(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Entrevistas Realizadas</h2>
      <div className="flex gap-2 mb-4">
        <button className="bg-emerald-600 text-white px-3 py-1 rounded" onClick={()=>exportar('csv')}>Exportar CSV</button>
        <button className="bg-amber-600 text-white px-3 py-1 rounded" onClick={()=>exportar('xlsx')}>Exportar XLSX</button>
      </div>
      {loading ? (<Loader />) : (<table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Entrevistador</th>
            <th className="border px-4 py-2">Entrevistado</th>
            <th className="border px-4 py-2">Data</th>
            <th className="border px-4 py-2">Linguagem</th>
            <th className="border px-4 py-2">Total CFP</th>
            <th className="border px-4 py-2">Kloc</th>
            <th className="border px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {entrevistas.map((e) => (
            <tr key={e.id}>
              <td className="border px-4 py-2">{e.nomeEntrevistador}</td>
              <td className="border px-4 py-2">{e.nomeEntrevistado}</td>
              <td className="border px-4 py-2">{e.dataEntrevista ? new Date(e.dataEntrevista).toLocaleDateString('pt-BR') : ''}</td>
              <td className="border px-4 py-2">{e.linguagem ?? 'Não informado'}</td>
              <td className="border px-4 py-2">{e.totalCFP ?? 0}</td>
              <td className="border px-4 py-2">{(e.tamanhoKloc ?? 0).toFixed ? (e.tamanhoKloc ?? 0).toFixed(3) : e.tamanhoKloc}</td>
              
              
              <td className="border px-4 py-2">
                <Link className="text-blue-600 underline" to={`/entrevistas/${e.id}`}>Ver Detalhes</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>)}
    </div>
  );
};

export default ListaEntrevistas;
