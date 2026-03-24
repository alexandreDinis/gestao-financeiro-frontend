import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "./use-auth";
import type { 
  ApiResponse, 
  TransacaoResponse, 
  TransacaoRequest
} from "@/types";

/**
 * Custom hooks for managing Lançamentos (Transações).
 * Heavily utilizes React Query for tenant-aware caching, 
 * optimistic updates, and automatic rollbacks on errors.
 */

// Define explicit filter shapes to ensure predictable query keys
export interface TransacoesFilters {
  mes?: number;
  ano?: number;
  tipo?: string;
  status?: string;
  origem?: string;
  tipoDespesa?: string;
  contaId?: number;
  categoriaId?: number;
  page?: number;
  size?: number;
}

// 1. Fetching (Queries)
export function useTransacoes(filters: TransacoesFilters) {
  const { user } = useAuth();
  // We use tenantId in the query key to ensure 100% cache isolation 
  const tenantId = user?.tenantId || "unknown_tenant";

  return useQuery({
    queryKey: ["transacoes", tenantId, filters],
    queryFn: async () => {
      // Convert filters to URLSearchParams format, stripping out undefined/ignores
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const { data } = await api.get<ApiResponse<TransacaoResponse[]>>(`/transacoes?${params.toString()}`);
      return data;
    },
    // Don't fetch until we have a user (tenant initialized)
    enabled: !!user,
  });
}

// 2. Mutations (General CRUD)
export function useCreateTransacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (newTransacao: TransacaoRequest) => api.post("/transacoes", newTransacao),
    onSuccess: () => {
      toast.success("Transação criada", "Lançamento adicionado com sucesso.");
      // Invalidate the entire transacoes scope for this tenant to force refetch
      queryClient.invalidateQueries({ queryKey: ["transacoes", user?.tenantId || "unknown_tenant"] });
    },
    onError: () => {
      toast.error("Erro", "Não foi possível criar o lançamento.");
    }
  });
}

export function useCreateTransacaoRecorrente() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (newRecorrencia: any) => api.post("/recorrencias", newRecorrencia),
    onSuccess: () => {
      toast.success("Recorrência criada", "Transação recorrente configurada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["transacoes", user?.tenantId || "unknown_tenant"] });
    },
    onError: () => {
      toast.error("Erro", "Não foi possível criar a transação recorrente.");
    }
  });
}

export function useDeleteTransacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/transacoes/${id}`),
    onSuccess: () => {
      toast.success("Transação excluída", "O lançamento foi apagado permanentemente.");
      queryClient.invalidateQueries({ queryKey: ["transacoes", user?.tenantId || "unknown_tenant"] });
    },
    onError: () => {
      toast.error("Erro na exclusão", "Ocorreu um erro ao tentar apagar esta transação.");
    }
  });
}

// 3. Mutations (Optimistic UI for Status Changes)
export function usePagarTransacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId || "unknown_tenant";

  return useMutation({
    mutationFn: (id: number) => api.put(`/transacoes/${id}/pagar`),
    // Optimistic Update
    onMutate: async (transacaoId) => {
      // Cancel pending queries so they don't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: ["transacoes", tenantId] });

      // Save previous state for potential rollback
      const previousState = queryClient.getQueriesData({ queryKey: ["transacoes", tenantId] });

      // Synchronously update the cache for instant UX
      queryClient.setQueriesData(
        { queryKey: ["transacoes", tenantId] },
        (oldQueryData: any) => {
          if (!oldQueryData) return oldQueryData;
          return {
            ...oldQueryData,
            data: oldQueryData.data.map((t: TransacaoResponse) => 
               t.id === transacaoId ? { ...t, status: "PAGO", dataPagamento: new Date().toISOString() } : t
            )
          };
        }
      );

      return { previousState };
    },
    onError: (err, variables, context) => {
      // Rollback to previous state on API failure
      toast.error("Erro ao Pagar", "A requisição falhou. Revertendo ação.");
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch in the background to ensure absolute sync
      queryClient.invalidateQueries({ queryKey: ["transacoes", tenantId] });
    },
    onSuccess: () => {
      toast.success("Status atualizado", "Lançamento marcado como Pago.");
    }
  });
}

export function useCancelarTransacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId || "unknown_tenant";

  return useMutation({
    mutationFn: (id: number) => api.put(`/transacoes/${id}/cancelar`),
    onMutate: async (transacaoId) => {
      await queryClient.cancelQueries({ queryKey: ["transacoes", tenantId] });
      const previousState = queryClient.getQueriesData({ queryKey: ["transacoes", tenantId] });

      queryClient.setQueriesData(
        { queryKey: ["transacoes", tenantId] },
        (oldQueryData: any) => {
          if (!oldQueryData) return oldQueryData;
          return {
            ...oldQueryData,
            data: oldQueryData.data.map((t: TransacaoResponse) => 
               t.id === transacaoId ? { ...t, status: "CANCELADO" } : t
            )
          };
        }
      );

      return { previousState };
    },
    onError: (err, variables, context) => {
      toast.error("Erro", "Falha ao cancelar o lançamento.");
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes", tenantId] });
    },
    onSuccess: () => {
      toast.success("Lançamento cancelado");
    }
  });
}
export function useTornarManualTransacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId || "unknown_tenant";

  return useMutation({
    mutationFn: (id: number) => api.patch(`/transacoes/${id}/tornar-manual`),
    onSuccess: () => {
      toast.success("Conversão concluída", "A transação agora é considerada manual.");
      queryClient.invalidateQueries({ queryKey: ["transacoes", tenantId] });
    },
    onError: () => {
      toast.error("Erro na conversão", "Não foi possível converter esta transação.");
    }
  });
}
