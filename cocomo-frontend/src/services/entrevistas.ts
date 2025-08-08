export async function getFuncionalidades(entrevistaId: string) {
  const res = await fetch(`/api/entrevistas/${entrevistaId}/funcionalidades`);
  if (!res.ok) throw new Error('Falha ao carregar funcionalidades');
  return res.json();
}

export async function postFuncionalidade(entrevistaId: string, payload: any) {
  const res = await fetch(`/api/entrevistas/${entrevistaId}/funcionalidades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao criar funcionalidade');
  return res.json();
}

export async function postRecalcular(entrevistaId: string) {
  const res = await fetch(`/api/entrevistas/${entrevistaId}/cosmic/recalcular`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Falha ao recalcular COSMIC/KLOC');
  return res.json() as Promise<{ totalCFP: number; kloc: number }>;
}
