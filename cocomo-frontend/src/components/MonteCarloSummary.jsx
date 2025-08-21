import React, { useState } from 'react';

/**
 * MonteCarloSummary
 * Renderiza um resumo amigável da simulação (PM e TDEV) e permite visualizar o JSON bruto.
 *
 * Props:
 * - data: { pm: {...}, tdev: {...}, pessoasMedias?: {...} }
 * - raw?: qualquer (opcional)
 * - compact?: boolean (render menor, para cards)
 */
export default function MonteCarloSummary({ data, raw = null, compact = false }) {
  const [showRaw, setShowRaw] = useState(false);
  const pm = data?.pm ?? {};
  const td = data?.tdev ?? {};
  const pessoas = data?.pessoasMedias ?? null;

  return (
    <div className={compact ? "" : "border rounded p-4"}>
      {!compact && <h4 className="text-lg font-semibold mb-2">Resultado Monte Carlo</h4>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h5 className="font-medium mb-1">Esforço (PM)</h5>
          <ul className="list-disc ml-5">
            <li>P10: {fmt(pm.p10)}</li>
            <li>P50: {fmt(pm.p50)}</li>
            <li>P90: {fmt(pm.p90)}</li>
            <li>Média: {fmt(pm.media ?? pm.mean)}</li>
            <li>Desvio: {fmt(pm.dp ?? pm.std)}</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-1">Prazo (meses)</h5>
          <ul className="list-disc ml-5">
            <li>P10: {fmt(td.p10)}</li>
            <li>P50: {fmt(td.p50)}</li>
            <li>P90: {fmt(td.p90)}</li>
            <li>Média: {fmt(td.media ?? td.mean)}</li>
            <li>Desvio: {fmt(td.dp ?? td.std)}</li>
          </ul>
        </div>
      </div>

      {pessoas && (
        <div className="mt-3 text-sm">
          <h5 className="font-medium mb-1">Pessoas médias</h5>
          <ul className="list-disc ml-5">
            <li>P50: {fmt(pessoas.p50)}</li>
            <li>P90: {fmt(pessoas.p90)}</li>
          </ul>
        </div>
      )}

      {raw !== null && (
        <div className="mt-3">
          <button
            type="button"
            className="text-blue-700 underline text-sm"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? 'Ocultar JSON' : 'Ver JSON bruto'}
          </button>
          {showRaw && (
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded max-h-64 overflow-auto">
              {safeStringify(raw)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(v) {
  if (v === undefined || v === null || Number.isNaN(+v)) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
