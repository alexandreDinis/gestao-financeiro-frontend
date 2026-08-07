import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface EstimativaPorCategoria {
  categoriaId: number;
  nome: string;
  media: number;
}

export interface EstimativaVariavel {
  valor: number;
  minimo: number;
  maximo: number;
  mesesConsiderados: number;
  porCategoria: EstimativaPorCategoria[];
}

export interface AjusteManual {
  entrada: number;
  saida: number;
}

export interface ItemPrevisaoDetalhamento {
  descricao: string;
  valor: number;
  tipo: string;
}

export interface PrevisaoMesResponse {
  mes: string;
  saldoInicial: number;
  receitasFixas: number;
  detalhamentoReceitasFixas?: ItemPrevisaoDetalhamento[];
  despesasFixas: number;
  detalhamentoDespesasFixas?: ItemPrevisaoDetalhamento[];
  estimativaVariavel: EstimativaVariavel;
  totalDespesasEstimadas?: number;
  ajusteManual: AjusteManual;
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
