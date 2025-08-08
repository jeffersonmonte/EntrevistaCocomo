# Patch COSMIC (Front)

Arquivos adicionados:
- `src/services/entrevistas.ts` — chamadas aos endpoints COSMIC
- `src/components/CosmicGrid.tsx` — componente com templates, E/X/R/W, total CFP e exportações CSV/XLSX

Como usar no formulário da Entrevista (exemplo):

```tsx
import CosmicGrid from '@/components/CosmicGrid';

export default function InterviewForm() {
  const { id } = useParams(); // id da entrevista
  const [resumo, setResumo] = useState<{ totalCFP:number; kloc:number } | null>(null);

  return (
    <div className="space-y-6">
      {/* ...restante do formulário SF/EM... */}

      <section className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Tamanho (COSMIC)</h2>
        <CosmicGrid entrevistaId={id!} onRecalc={(r)=>setResumo(r)} />
        {resumo && (
          <div className="mt-3 text-sm">
            <span className="inline-block mr-4">Total CFP: <b>{resumo.totalCFP}</b></span>
            <span className="inline-block">KLOC: <b>{resumo.kloc}</b></span>
          </div>
        )}
      </section>
    </div>
  );
}
```

Dependências necessárias:
```bash
npm i xlsx file-saver
```

Endpoints esperados no backend:
- `GET /api/entrevistas/{id}/funcionalidades`
- `POST /api/entrevistas/{id}/funcionalidades`
- `POST /api/entrevistas/{id}/cosmic/recalcular`
