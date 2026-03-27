import { api } from "@/lib/axios";
import { Divida, DividaRequest, TipoDivida, PagarParcelaRequest, DividasResumo, StatusDivida } from "../types";

export const DividasService = {
  listar: async (tipo?: TipoDivida, pessoaId?: number, ano?: number, mes?: number, status?: StatusDivida): Promise<DividasResumo> => {
    const params = new URLSearchParams();
    if (tipo) params.append("tipo", tipo);
    if (pessoaId) params.append("pessoaId", pessoaId.toString());
    if (ano) params.append("ano", ano.toString());
    if (mes) params.append("mes", mes.toString());
    if (status) params.append("status", status);
    
    params.append("page", "0");
    params.append("size", "100");

    const { data } = await api.get(`/dividas?${params.toString()}`);
    return data.data; 
  },

  buscarPorId: async (id: number): Promise<Divida> => {
    const { data } = await api.get(`/dividas/${id}`);
    return data.data;
  },

  criar: async (request: DividaRequest): Promise<Divida> => {
    const { data } = await api.post("/dividas", request);
    return data.data;
  },

  pagarParcela: async (parcelaId: number, request: PagarParcelaRequest): Promise<any> => {
    const { data } = await api.put(`/dividas/parcelas/${parcelaId}/pagar`, request);
    return data.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/dividas/${id}`);
  },

  exportarPdf: async (tipo?: TipoDivida, pessoaId?: number, ano?: number, mes?: number, status?: StatusDivida): Promise<void> => {
    const params = new URLSearchParams();
    if (tipo) params.append("tipo", tipo);
    if (pessoaId) params.append("pessoaId", pessoaId.toString());
    if (ano) params.append("ano", ano.toString());
    if (mes) params.append("mes", mes.toString());
    if (status) params.append("status", status);

    const { data } = await api.get(`/dividas/exportar-pdf?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-dividas-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
