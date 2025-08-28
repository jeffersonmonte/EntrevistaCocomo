export type Entrevista = {
  id: string;
  nomeEntrevista: string;
  dataEntrevista: string; // ISO
  tipoEntrada: number;    // 0=COSMIC, 1=PF
  linguagem?: string | null;
  totalCFP?: number;
  tamanhoKloc?: number;
  esforcoPM?: number;
  prazoMeses?: number;
};
