import { useEffect, useState } from "react";
import axios from "axios";

type EntrevistaResumo = {
  id: number;
  nomeEntrevistado: string;
  nomeEntrevistador: string;
  dataEntrevista: string;
};

export default function InterviewList() {
  const [entrevistas, setEntrevistas] = useState<EntrevistaResumo[]>([]);

  useEffect(() => {
    axios.get("/api/Entrevistas")
      .then(res => setEntrevistas(res.data))
      .catch(err => console.error("Erro ao buscar entrevistas:", err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Entrevistas Realizadas</h2>
      <ul className="space-y-2">
        {entrevistas.map(e => (
          <li key={e.id} className="p-2 border rounded">
            <strong>{e.nomeEntrevistado}</strong> entrevistado por <em>{e.nomeEntrevistador}</em> em {new Date(e.dataEntrevista).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}