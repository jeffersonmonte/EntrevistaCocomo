
import { useForm, useFieldArray } from "react-hook-form";

const SCALE_FACTORS = ["PREC", "FLEX", "RESL", "TEAM", "PMAT"];
const EFFORT_MULTIPLIERS = ["RCPX", "RUSE", "PDIF", "PERS", "PREX", "FCIL", "SCED"];

const NIVEIS = [
  { label: "Muito Baixo", value: "MuitoBaixo" },
  { label: "Baixo", value: "Baixo" },
  { label: "Nominal", value: "Nominal" },
  { label: "Alto", value: "Alto" },
  { label: "Muito Alto", value: "MuitoAlto" }
];

const SF_INFO = {
  PREC: { nome: "Precedência do Projeto", desc: "Nível de experiência em projetos similares." },
  FLEX: { nome: "Flexibilidade de Processo", desc: "Liberdade para seguir processos diferentes." },
  RESL: { nome: "Resolução de Riscos", desc: "Maturidade da equipe em prever/tratar riscos." },
  TEAM: { nome: "Coesão da Equipe", desc: "Quão bem a equipe trabalha junta." },
  PMAT: { nome: "Maturidade do Processo", desc: "Nível de formalização de processos (baseado em CMMI)." }
};

const EM_INFO = {
  RCPX: { nome: "Complexidade do Produto", desc: "Algoritmos, interações, funcionalidades críticas." },
  RUSE: { nome: "Reusabilidade Requerida", desc: "O quanto o código precisa ser reutilizável." },
  PDIF: { nome: "Dificuldade da Plataforma", desc: "Restrições de SO, hardware, comunicação, etc." },
  PERS: { nome: "Capacidade da Equipe", desc: "Qualidade técnica dos desenvolvedores e analistas." },
  PREX: { nome: "Experiência da Equipe", desc: "Experiência com o domínio, tecnologia, ferramentas." },
  FCIL: { nome: "Apoio de Ferramentas", desc: "Ferramentas CASE, automações, frameworks." },
  SCED: { nome: "Pressão de Cronograma", desc: "Se o cronograma está apertado ou relaxado." }
};

export default function InterviewForm() {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      scaleFactors: SCALE_FACTORS.map(nome => ({ nome, nivel: "Nominal", valor: 1 })),
      effortMultipliers: EFFORT_MULTIPLIERS.map(nome => ({ nome, nivel: "Nominal", valor: 1 }))
    }
  });

  const { fields: sfFields } = useFieldArray({ control, name: "scaleFactors" });
  const { fields: emFields } = useFieldArray({ control, name: "effortMultipliers" });

  const onSubmit = (data) => {
    console.log("Enviando:", data);
    // axios.post("/api/Entrevistas", data)
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Nova Entrevista</h2>

      <div className="grid grid-cols-1 gap-4">
        <label>
          Nome do Entrevistado:
          <input {...register("nomeEntrevistado")} className="input block w-full" />
        </label>
        <label>
          Nome do Entrevistador:
          <input {...register("nomeEntrevistador")} className="input block w-full" />
        </label>
        <label>
          Data da Entrevista:
          <input type="date" {...register("dataEntrevista")} className="input block w-full" />
        </label>
        <label>
          Linguagem:
          <input {...register("linguagem")} className="input block w-full" />
        </label>
        <label>
          Tipo Entrada (1=KLOC, 2=PF, 3=COMIC):
          <input type="number" {...register("tipoEntrada")} className="input block w-full" />
        </label>
        <label>
          Valor KLOC:
          <input type="number" {...register("valorKloc")} className="input block w-full" />
        </label>
        <label>
          Pontos de Função:
          <input type="number" {...register("pontosDeFuncao")} className="input block w-full" />
        </label>
        <label>
          Entradas:
          <input type="number" {...register("entradas")} className="input block w-full" />
        </label>
        <label>
          Saídas:
          <input type="number" {...register("saidas")} className="input block w-full" />
        </label>
        <label>
          Leitura:
          <input type="number" {...register("leitura")} className="input block w-full" />
        </label>
        <label>
          Gravação:
          <input type="number" {...register("gravacao")} className="input block w-full" />
        </label>
      </div>

      <h3 className="text-lg font-semibold mt-6">Fatores de Escala (Scale Factors)</h3>
      {sfFields.map((field, index) => (
        <div key={field.id} className="mb-2 flex gap-2 items-center">
          <label className="w-48" title={SF_INFO[field.nome].desc}>
            {field.nome} - {SF_INFO[field.nome].nome}
          </label>
          <select {...register(`scaleFactors.${index}.nivel`)} className="input">
            {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
          <input type="number" step="0.01" {...register(`scaleFactors.${index}.valor`)} className="input w-24" />
        </div>
      ))}

      <h3 className="text-lg font-semibold mt-6">Multiplicadores de Esforço (Effort Multipliers)</h3>
      {emFields.map((field, index) => (
        <div key={field.id} className="mb-2 flex gap-2 items-center">
          <label className="w-48" title={EM_INFO[field.nome].desc}>
            {field.nome} - {EM_INFO[field.nome].nome}
          </label>
          <select {...register(`effortMultipliers.${index}.nivel`)} className="input">
            {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
          <input type="number" step="0.01" {...register(`effortMultipliers.${index}.valor`)} className="input w-24" />
        </div>
      ))}

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salvar Entrevista</button>
    </form>
  );
}
