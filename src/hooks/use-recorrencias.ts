import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";
import type { ApiResponse, Recorrencia } from "@/types";

export function useRecorrencias() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || "unknown";

  return useQuery({
    queryKey: ["recorrencias", tenantId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Recorrencia[]>>("/recorrencias");
      return (data.data as any).content || data.data;
    },
    enabled: !!user,
  });
}

export function useCreateRecorrencia() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (newRec: Partial<Recorrencia>) => api.post<Recorrencia>("/recorrencias", newRec),
    onSuccess: () => {
      toast.success("Recorrência criada", "A automação foi configurada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["recorrencias", user?.tenantId || "unknown"] });
    },
    onError: () => {
      toast.error("Erro", "Não foi possível criar a recorrência.");
    }
  });
}

export function useDeleteRecorrencia() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/recorrencias/${id}`),
    onSuccess: () => {
      toast.success("Excluída", "Recorrência removida.");
      queryClient.invalidateQueries({ queryKey: ["recorrencias", user?.tenantId || "unknown"] });
    },
    onError: () => {
      toast.error("Erro", "Falha ao excluir recorrência.");
    }
  });
}

export function useGerarManualRecorrencias() {
  return useMutation({
    mutationFn: () => api.post("/recorrencias/gerar-manual"),
    onSuccess: () => {
      toast.success("Processamento iniciado", "As transações pendentes estão sendo geradas.");
    },
    onError: () => {
      toast.error("Erro", "Falha ao disparar processamento manual.");
    }
  });
}
