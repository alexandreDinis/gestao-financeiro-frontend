import { api } from "@/lib/axios";
import { Divida, DividaRequest, TipoDivida, PagarParcelaRequest } from "../types";

export const DividasService = {
  listar: async (tipo?: TipoDivida): Promise<Divida[]> => {
    const params = new URLSearchParams();
    if (tipo) params.append("tipo", tipo);
    params.append("page", "0");
    params.append("size", "100");

    const { data } = await api.get(`/dividas?${params.toString()}`);
    return data.data; // ApiResponse.ok(Page) extracts content to data.data
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
  }
};
