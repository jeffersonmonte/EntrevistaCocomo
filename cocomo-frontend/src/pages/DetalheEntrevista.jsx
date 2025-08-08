import Loader from '../components/Loader';
import CosmicGrid from '../components/CosmicGrid';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const DetalheEntrevista = () => {
  const { id } = useParams();
  const [entrevista, setEntrevista] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(true);
    axios.get(`/api/Entrevistas/${id}`).then((res) => {
      setEntrevista(res.data);
    });
  }, [id]);

  if (!entrevista) return <p className="p-4">Carregando...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Entrevista de {entrevista.nomeEntrevistado}</h2>
      <p><strong>Entrevistador:</strong> {entrevista.nomeEntrevistador}</p>
      <p><strong>Entrevistado:</strong> {entrevista.nomeEntrevistado}</p>
      <p><strong>Data:</strong> {entrevista.dataEntrevista?.substring(0, 10)}</p>
      <p><strong>Linguagem:</strong> {entrevista.linguagem || 'Não informado'}</p>
      <p><strong>Tipo Entrada:</strong> {entrevista.tipoEntrada === 1 ? 'KLOC' : 'Pontos de Função'}</p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Tamanho (COSMIC)</h3>
      <div className="bg-gray-50 p-4 rounded mb-6">
        <p><strong>Total CFP:</strong> {entrevista.totalCFP ?? 0}</p>
        <p><strong>KLOC:</strong> {(entrevista.tamanhoKloc ?? 0).toFixed ? (entrevista.tamanhoKloc ?? 0).toFixed(3) : entrevista.tamanhoKloc}</p>
      </div>

      <h3 className="text-lg font-semibold mb-2">Resultado do COCOMO</h3>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Esforço:</strong> {entrevista.esforcoPM?.toFixed(2)} pessoa-mês</p>
        <p><strong>Duração:</strong> {entrevista.prazoMeses?.toFixed(2)} meses</p>
        <p><strong>Pessoas necessárias:</strong> {(entrevista.esforcoPM / entrevista.prazoMeses)?.toFixed(2)}</p>
      </div>
    

    </div>
  );
};

export default DetalheEntrevista;
