import { useEffect, useState } from "react";
import axios from "axios";

type EntrevistaResumo = {
  id: number;
  nomeEntrevista?: string;
  dataEntrevista: string;
};

export default function InterviewList() {
  const [entrevistas, setEntrevistas] = useState<EntrevistaResumo[]>([]);

  useEffect(() => {
    axios.get("/api/Entrevistas")
      .then(res => setEntrevistas(res.data))
      .catch(() => setEntrevistas([]));
  }, []);

  if (!entrevistas?.length) {
    return <p className="text-slate-300 text-sm">Nenhuma entrevista encontrada.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entrevistas.map(e => (
        <article key={e.id} className="card flex flex-col gap-2">
          <header className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1">{e.nomeEntrevista || "Sem título"}</h3>
            <span className="badge">{new Date(e.dataEntrevista).toLocaleDateString()}</span>
          </header>
        </article>
      ))}
    </div>
  );
}