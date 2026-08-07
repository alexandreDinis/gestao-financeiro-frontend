import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DividasService } from "../services/dividas.service";
import { DIVIDAS_QUERY_KEY } from "./use-dividas-query";
import { PESSOAS_QUERY_KEY } from "@/features/pessoas/hooks/use-pessoas-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/lib/toast";
import { Divida, PagarParcelaRequest, PagarMultiplasParcelasRequest } from "../types";

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
      queryClient.invalidateQueries({ queryKey: ["relatorios-gastos-mensais"] });
      queryClient.invalidateQueries({ queryKey: ["relatorios-receitas-mensais"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível registrar a dívida.");
    }
  });
}

export function useAtualizarDividaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: import("../types").DividaRequest }) =>
      DividasService.atualizar(id, request),
    onSuccess: () => {
      toast.success("Dívida Atualizada", "As alterações foram salvas com sucesso.");
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
      queryClient.invalidateQueries({ queryKey: ["relatorios-gastos-mensais"] });
      queryClient.invalidateQueries({ queryKey: ["relatorios-receitas-mensais"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível atualizar a dívida.");
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
      const previousDividasBatches = queryClient.getQueriesData<any>(queryFilter);

      // 3. Optimistically update all cached dividas structures that contain this parcela
      queryClient.setQueriesData<any>(queryFilter, (oldData: any) => {
        if (!oldData) return oldData;

        // Se a query retornar o resumo { items: [...], totalGeral: ... }
        if (oldData.items && Array.isArray(oldData.items)) {
          return {
            ...oldData,
            items: oldData.items.map((divida: Divida) => {
              const hasParcela = divida.parcelas?.some(p => p.id === parcelaId);
              if (!hasParcela) return divida;

              return {
                ...divida,
                parcelas: divida.parcelas.map(p => 
                  p.id === parcelaId 
                    ? { ...p, status: 'PAGO', dataPagamento: new Date().toISOString() } 
                    : p
                )
              };
            })
          };
        }

        // Se for um array direto de dividas
        if (Array.isArray(oldData)) {
          return oldData.map((divida: Divida) => {
            const hasParcela = divida.parcelas?.some(p => p.id === parcelaId);
            if (!hasParcela) return divida;

            return {
              ...divida,
              parcelas: divida.parcelas.map(p => 
                p.id === parcelaId 
                  ? { ...p, status: 'PAGO', dataPagamento: new Date().toISOString() } 
                  : p
              )
            };
          });
        }

        return oldData;
      });

      return { previousDividasBatches };
    },
    onError: (err: any, variables, context) => {
      // Revert if error
      toast.error("Erro no Pagamento", err?.response?.data?.message || err?.message || "Não foi possível processar a parcela.");
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); 
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
      queryClient.invalidateQueries({ queryKey: ["previsao-caixa"] });
      queryClient.invalidateQueries({ queryKey: ["contas"] });
    },
  });
}

export function usePagarMultiplasParcelasMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (request: PagarMultiplasParcelasRequest) => 
      DividasService.pagarMultiplasParcelas(request),
    onSuccess: (_data, variables) => {
      const count = variables.parcelaIds.length;
      toast.success("Pagamento em Lote", `${count} parcela(s) quitadas com sucesso.`);
    },
    onError: (error: any) => {
      toast.error("Erro no Pagamento", error.response?.data?.message || "Não foi possível processar o pagamento em lote.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] });
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

export function useProcessarRecorrenciasMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: DividasService.processarRecorrencias,
    onSuccess: () => {
      toast.success("Recorrências Atualizadas", "O processamento de dívidas recorrentes foi concluído.");
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível processar as recorrências.");
    }
  });
}

export function useCancelarRecorrenciaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: DividasService.cancelarRecorrencia,
    onSuccess: () => {
      toast.success("Recorrência Encerrada", "A cobrança recorrente foi encerrada com sucesso.");
      queryClient.invalidateQueries({ queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível encerrar a recorrência.");
    }
  });
}
