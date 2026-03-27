import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DividasService } from "../services/dividas.service";
import { DIVIDAS_QUERY_KEY } from "./use-dividas-query";
import { PESSOAS_QUERY_KEY } from "@/features/pessoas/hooks/use-pessoas-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/lib/toast";
import { Divida, PagarParcelaRequest } from "../types";

export function useCriarDividaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: DividasService.criar,
    onSuccess: () => {
      toast.success("Empréstimo Registrado", "A dívida foi criada e as parcelas geradas.");
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] }); // Updates score
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível registrar a dívida.");
    }
  });
}

export function usePagarParcelaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ parcelaId, request }: { parcelaId: number; request: PagarParcelaRequest }) => 
      DividasService.pagarParcela(parcelaId, request),
    onMutate: async ({ parcelaId }) => {
      // 1. Cancel active queries to prevent overwriting our optimistic update
      const queryFilter = { queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] };
      await queryClient.cancelQueries(queryFilter);

      // 2. Snapshot the previous value
      const previousDividasBatches = queryClient.getQueriesData<Divida[]>(queryFilter);

      // 3. Optimistically update all cached dividas arrays that contain this parcela
      queryClient.setQueriesData<Divida[]>(queryFilter, (oldData) => {
        if (!oldData) return [];
        return oldData.map(divida => {
          // Check if this divida has the parcela
          const hasParcela = divida.parcelas.some(p => p.id === parcelaId);
          if (!hasParcela) return divida;

          // Clone and update the specific parcela
          return {
            ...divida,
            parcelas: divida.parcelas.map(p => 
              p.id === parcelaId 
                ? { ...p, status: 'PAGO', dataPagamento: new Date().toISOString() } 
                : p
            )
            // Ideally we'd also recalculate valorRestante here, but the server invalidation will fix it shortly
          };
        });
      });

      return { previousDividasBatches };
    },
    onError: (err, variables, context) => {
      // Revert if error
      toast.error("Erro no Pagamento", "Não foi possível processar a parcela.");
      if (context?.previousDividasBatches) {
        context.previousDividasBatches.forEach(([queryKey, data]) => {
           queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      toast.success("Parcela Paga", "O pagamento foi registrado com sucesso.");
    },
    onSettled: () => {
      // Final sync to ensure everything including balances and scores are 100% correct
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] }); 
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); // Optional: Multi-invalidation 
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
    },
  });
}

export function useDeletarDividaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: DividasService.deletar,
    onSuccess: () => {
      toast.success("Dívida Excluída", "O registro foi deletado permanentemente.");
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível excluir a dívida.");
    }
  });
}
