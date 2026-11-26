import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import type { ApiResponse, DashboardResponse } from "@/types";

/**
 * Hook isolado por tenant para o Dashboard v3.
 * Garante isolamento de cache multi-tenant e evita requisições antes da autenticação.
 */
export function useDashboard() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "unknown_tenant";

  return useQuery<DashboardResponse>({
    queryKey: ["dashboard-v2", tenantId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardResponse>>("/dashboard");
      return data.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 1,
  });
}
