import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "./use-auth";
import type { ApiResponse } from "@/types";

export interface FluxoMensalRelatorioItem {
  mes: number;
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
  mesLabel: string;
}

const MESES_CURTOS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function useRelatorioFluxo(meses: 6 | 12 = 6) {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "unknown_tenant";

  return useQuery<FluxoMensalRelatorioItem[]>({
    queryKey: ["relatorio-fluxo-mensal", tenantId, meses],
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<Array<{ mes: number; ano: number; receitas: number; despesas: number; saldo: number }>>
      >(`/relatorios/fluxo-mensal`, { params: { meses } });
      return (data.data || []).map((item) => ({
        ...item,
        mesLabel: `${MESES_CURTOS[(item.mes - 1 + 12) % 12]}/${String(item.ano).slice(-2)}`,
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
