import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "./use-auth";
import type { ApiResponse, RelatorioReceitasMensais } from "@/types";

export function useRelatorioReceitas(ano: number, mes: number) {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "unknown_tenant";

  return useQuery<RelatorioReceitasMensais>({
    queryKey: ["relatorio-receitas-mensais", tenantId, ano, mes],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RelatorioReceitasMensais>>(
        `/relatorios/receitas-mensais`,
        { params: { ano, mes } }
      );
      return data.data;
    },
    enabled: !!user && mes >= 1 && mes <= 12 && ano >= 2000,
    staleTime: 1000 * 60 * 5,
  });
}
