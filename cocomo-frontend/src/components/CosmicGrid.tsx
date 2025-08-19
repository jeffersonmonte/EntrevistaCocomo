import React, { useEffect, useMemo, useState } from "react";

// Tipagem opcional para o item vindo do endpoint de conversões
type FormatoConversao = "CFP_KLOC" | "LOC_CFP" | undefined;
interface Conversao {
  tipoEntrada: string;           // ex.: 'COSMIC'
  contexto?: string | null;      // ex.: 'C#' | '.NET' | 'Padrão'
  fatorConversao: number;        // número positivo
  formato?: FormatoConversao;    // 'CFP_KLOC' (CFP por KLOC) ou 'LOC_CFP' (LOC por CFP)
}

interface Props {
  linguagem?: string;
  onChange?: (data: { totalCFP: number; kloc: number }) => void;
}

const CosmicInlineGrid: React.FC<Props> = ({ linguagem, onChange }) => {
  // Novo fallback mais conservador: ~30 LOC/CFP => 1000/30 ≈ 33 CFP/KLOC
  const [fator, setFator] = useState<number>(33); // unidade interna = CFP/KLOC
  const [totalCFP, setTotalCFP] = useState<number>(0);
  const [convs, setConvs] = useState<Conversao[]>([]);
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    async function fetchConversoes() {
      try {
        const resp = await fetch("/api/config/conversoes");
        if (!resp.ok) throw new Error("HTTP error");
        const data = (await resp.json()) as Conversao[];
        setConvs(Array.isArray(data) ? data : []);
        setApiStatus("ok");
      } catch (e) {
        console.error("Erro ao carregar conversões", e);
        setApiStatus("error");
      }
    }
    fetchConversoes();
  }, []);

  useEffect(() => {
    // Seleciona por linguagem; se não achar, usa 'Padrão'
    const lang = (linguagem || "").toLowerCase();
    const matchSpecific = convs.find(
      (c) =>
        c.tipoEntrada === "COSMIC" &&
        (c.contexto?.toLowerCase?.() === lang)
    );
    const matchPadrao = convs.find(
      (c) => c.tipoEntrada === "COSMIC" && (!c.contexto || c.contexto === "Padrão")
    );

    let fatorVal = matchSpecific?.fatorConversao ?? matchPadrao?.fatorConversao;
    const formato: FormatoConversao =
      matchSpecific?.formato ?? matchPadrao?.formato ?? undefined;

    // Padronização: internamente trabalhamos com CFP/KLOC.
    // Se o backend já envia em CFP/KLOC => usar direto.
    // Se vier em LOC/CFP => converter: CFP/KLOC = 1000 / (LOC/CFP)
    if (fatorVal && fatorVal > 0) {
      if (formato === "LOC_CFP") {
        fatorVal = 1000 / fatorVal; // converte de LOC/CFP para CFP/KLOC
      } else if (formato === "CFP_KLOC") {
        // ok, já está no formato interno
      } else {
        // Heurística quando a API não informa formato:
        // valores típicos de LOC/CFP ~ 15..150 -> converter
        const pareceLOCporCFP = fatorVal >= 15 && fatorVal <= 150;
        if (pareceLOCporCFP) {
          fatorVal = 1000 / fatorVal;
        }
      }
      setFator(Number(fatorVal));
    }
  }, [convs, linguagem]);

  // Cálculo padronizado: fator é CFP/KLOC => KLOC = CFP / (CFP/KLOC)
  const kloc = useMemo(() => {
    return fator > 0 ? +(totalCFP / fator).toFixed(3) : 0;
  }, [totalCFP, fator]);

  useEffect(() => {
    onChange?.({ totalCFP, kloc });
  }, [totalCFP, kloc, onChange]);

  // Aviso de sanidade: faixa plausível para CFP/KLOC (≈ 1000/LOC/CFP)
  const fatorForaFaixa = fator < 12 || fator > 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">
          Fator de conversão (CFP/KLOC)
        </label>
        <input
          type="number"
          step="0.001"
          className="border rounded px-2 py-1 w-32"
          value={fator}
          onChange={(e) => setFator(Number(e.target.value))}
          min={0}
        />
      </div>
      {apiStatus === "error" && (
        <div className="text-xs text-amber-700">
          ⚠️ Não foi possível carregar os fatores do servidor. Usando valor padrão.
        </div>
      )}
      {fatorForaFaixa && (
        <div className="text-xs text-red-600">
          ⚠️ Fator fora da faixa típica. Verifique a unidade vinda do backend
          (LOC/CFP vs CFP/KLOC) ou calibre com dados históricos do seu contexto C#/.NET.
        </div>
      )}
      <div className="text-sm">
        Total CFP: <strong>{totalCFP}</strong>
      </div>
      <div className="text-sm">
        KLOC (derivado): <strong>{kloc}</strong>
      </div>
    </div>
  );
};

export default CosmicInlineGrid;
