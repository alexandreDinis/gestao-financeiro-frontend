import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface PrevisaoMesResponse {
  mes: number;
  ano: number;
  saldoInicial: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  ajusteEntrada: number;
  ajusteSaida: number;
  saldoFinal: number;
}

export interface RelatorioPrevisaoResponse {
  saldoAtual: number;
  meses: PrevisaoMesResponse[];
}

export interface PrevisaoAjusteRequest {
  mes: number;
  ano: number;
  ajusteEntrada?: number;
  ajusteSaida?: number;
}

export function usePrevisaoCaixa(meses: number = 12) {
  return useQuery({
    queryKey: ["previsaoCaixa", meses],
    queryFn: async () => {
      const response = await api.get<RelatorioPrevisaoResponse>(`/previsao?meses=${meses}`);
      return response.data;
    },
  });
}

export function useSalvarAjustePrevisao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PrevisaoAjusteRequest) => {
      await api.post("/previsao/ajustes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["previsaoCaixa"] });
    },
  });
}
