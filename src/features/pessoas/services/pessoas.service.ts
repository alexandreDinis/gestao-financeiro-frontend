import { api } from "@/lib/axios";
import { Pessoa, PessoaRequest } from "../types";

export const PessoasService = {
  listar: async (): Promise<Pessoa[]> => {
    // Basic pagination limit for MVP
    const { data } = await api.get("/pessoas?page=0&size=100");
    return data.data; // ApiResponse.ok(Page) extracts content to data.data
  },

  buscarPorId: async (id: number): Promise<Pessoa> => {
    const { data } = await api.get(`/pessoas/${id}`);
    return data.data;
  },

  criar: async (request: PessoaRequest): Promise<Pessoa> => {
    const { data } = await api.post("/pessoas", request);
    return data.data;
  },

  atualizar: async (id: number, request: PessoaRequest): Promise<Pessoa> => {
    const { data } = await api.put(`/pessoas/${id}`, request);
    return data.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/pessoas/${id}`);
  }
};
