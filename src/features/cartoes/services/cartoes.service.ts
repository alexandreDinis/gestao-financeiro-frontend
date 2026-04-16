import { api } from "@/lib/axios";
import { ApiResponse } from "@/types";
import { CartaoCredito, CartaoCreditoRequest, FaturaCartao, CompraCartaoRequest } from "../types";

export const CartoesService = {
  // Cartão Controller
  listar: async (): Promise<CartaoCredito[]> => {
    const { data } = await api.get<ApiResponse<CartaoCredito[]>>('/cartoes');
    return data.data;
  },

  buscar: async (id: number): Promise<CartaoCredito> => {
    const { data } = await api.get<ApiResponse<CartaoCredito>>(`/cartoes/${id}`);
    return data.data;
  },

  criar: async (request: CartaoCreditoRequest): Promise<CartaoCredito> => {
    const { data } = await api.post<ApiResponse<CartaoCredito>>('/cartoes', request);
    return data.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/cartoes/${id}`);
  },

  editar: async (id: number, request: CartaoCreditoRequest): Promise<CartaoCredito> => {
    const { data } = await api.put<ApiResponse<CartaoCredito>>(`/cartoes/${id}`, request);
    return data.data;
  },

  // Faturas Controller
  listarFaturas: async (cartaoId: number): Promise<FaturaCartao[]> => {
    const { data } = await api.get<ApiResponse<FaturaCartao[]>>(`/cartoes/${cartaoId}/faturas`);
    return data.data;
  },

  buscarFatura: async (faturaId: number): Promise<FaturaCartao> => {
    const { data } = await api.get<ApiResponse<FaturaCartao>>(`/cartoes/faturas/${faturaId}`);
    return data.data;
  },

  pagarFatura: async (faturaId: number, contaId: number, dataPagamento: string): Promise<FaturaCartao> => {
    const { data } = await api.put<ApiResponse<FaturaCartao>>(`/cartoes/faturas/${faturaId}/pagar`, {
      contaId,
      dataPagamento,
    });
    return data.data;
  },

  // Compra Controller
  comprar: async (request: CompraCartaoRequest): Promise<FaturaCartao> => {
    const { data } = await api.post<ApiResponse<FaturaCartao>>('/cartoes/compra', request);
    return data.data;
  }
};
