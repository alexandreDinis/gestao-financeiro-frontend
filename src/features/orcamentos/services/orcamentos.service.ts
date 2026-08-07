import { api } from "@/lib/axios";
import { 
  OrcamentoResponse, 
  OrcamentoResumoResponse, 
  OrcamentoRequest,
  OrcamentoSugestaoResponse,
  GerarOrcamentoLoteRequest 
} from "../types";

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

  obterSugestoes: async (mes: number, ano: number, mesesHistorico: number = 3) => {
    const { data } = await api.get<{ data: OrcamentoSugestaoResponse[] }>("/orcamentos/sugestao", {
      params: { mes, ano, mesesHistorico }
    });
    return data.data;
  },

  salvarLote: async (request: GerarOrcamentoLoteRequest) => {
    const { data } = await api.post<{ data: OrcamentoResponse[] }>("/orcamentos/lote", request);
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
