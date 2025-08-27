import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";
export const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const ROOT = "/api/Entrevistas";

// LISTAR
export async function listarEntrevistas() {
  const { data } = await http.get(`${ROOT}`);
  return data;
}

// OBTER
export async function obterEntrevista(id) {
  const { data } = await http.get(`${ROOT}/${id}`);
  return data;
}

// CRIAR
export async function criarEntrevista(payload) {
  const { data } = await http.post(`${ROOT}`, payload);
  return data;
}

// ATUALIZAR
export async function atualizarEntrevista(id, payload) {
  await http.put(`${ROOT}/${id}`, payload);
}

// EXCLUIR
export async function excluirEntrevista(id) {
  await http.delete(`${ROOT}/${id}`);
}

// CRIAR COM COSMIC (se necessário em outro fluxo)
export async function criarEntrevistaComCosmic(payload) {
  const { data } = await http.post(`${ROOT}/com-cosmic`, payload);
  return data; // { id, totalCFP, tamanhoKloc }
}
