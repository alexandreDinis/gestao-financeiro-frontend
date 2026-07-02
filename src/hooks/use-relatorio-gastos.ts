import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "./use-auth";
import type { ApiResponse, RelatorioGastosMensais } from "@/types";

/**
 * Hook para buscar o relatório detalhado de gastos mensais.
 * Retorna dados hierárquicos agrupados por categoria/subcategoria
 * com totais e percentuais pré-calculados pelo backend.
 */
export function useRelatorioGastos(ano: number, mes: number) {
  const { user } = useAuth();

  return useQuery<RelatorioGastosMensais>({
    queryKey: ["relatorio-gastos-mensais", ano, mes],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RelatorioGastosMensais>>(
        `/relatorios/gastos-mensais`,
        { params: { ano, mes } }
      );
      return data.data;
    },
    enabled: !!user && mes >= 1 && mes <= 12 && ano >= 2000,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
