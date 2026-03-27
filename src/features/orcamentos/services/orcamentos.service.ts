import { api } from "@/lib/axios";
import { OrcamentoResponse, OrcamentoResumoResponse, OrcamentoRequest } from "../types";

export const OrcamentosService = {
  listar: async (mes: number, ano: number) => {
    const { data } = await api.get<{ data: OrcamentoResponse[] }>("/orcamentos", {
      params: { mes, ano }
    });
    return data.data;
  },

  resumo: async (mes: number, ano: number) => {
    const { data } = await api.get<{ data: OrcamentoResumoResponse[] }>("/orcamentos/resumo", {
      params: { mes, ano }
    });
    return data.data;
  },

  criar: async (request: OrcamentoRequest) => {
    const { data } = await api.post<{ data: OrcamentoResponse }>("/orcamentos", request);
    return data.data;
  },

  atualizar: async (id: number, request: OrcamentoRequest) => {
    const { data } = await api.put<{ data: OrcamentoResponse }>(`/orcamentos/${id}`, request);
    return data.data;
  },

  deletar: async (id: number) => {
    await api.delete(`/orcamentos/${id}`);
  }
};
