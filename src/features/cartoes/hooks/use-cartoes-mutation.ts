import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CartoesService } from "../services/cartoes.service";
import { CARTOES_QUERY_KEY, FATURAS_QUERY_KEY } from "./use-cartoes-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/lib/toast";

export function useCriarCartaoMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: CartoesService.criar,
    onSuccess: () => {
      toast.success("Cartão Cadastrado", "O cartão de crédito foi registrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: [CARTOES_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["contas", user?.tenantId] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível cadastrar o cartão.");
    }
  });
}

export function useEditarCartaoMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      CartoesService.editar(id, data),
    onSuccess: () => {
      toast.success(
        "Cartão Atualizado",
        "As informações do cartão foram alteradas com sucesso."
      );
      queryClient.invalidateQueries({
        queryKey: [CARTOES_QUERY_KEY, user?.tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["contas", user?.tenantId] });
    },
    onError: (error: any) => {
      toast.error(
        "Erro",
        error.response?.data?.message || "Não foi possível editar o cartão."
      );
    },
  });
}

export function useDeletarCartaoMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: CartoesService.deletar,
    onSuccess: () => {
      toast.success("Cartão Excluído", "O cartão foi removido.");
      queryClient.invalidateQueries({ queryKey: [CARTOES_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: ["contas", user?.tenantId] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível excluir o cartão.");
    }
  });
}

export function useCompraCartaoMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: CartoesService.comprar,
    onSuccess: (_, variables) => {
      toast.success("Compra Lançada", "A despesa foi lançada na fatura do cartão.");
      queryClient.invalidateQueries({ queryKey: [FATURAS_QUERY_KEY, user?.tenantId, variables.cartaoId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível registrar a compra no cartão.");
    }
  });
}

export function usePagarFaturaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ faturaId, cartaoId }: { faturaId: number, cartaoId: number }) => CartoesService.pagarFatura(faturaId),
    onSuccess: (_, variables) => {
      toast.success("Fatura Paga", "O pagamento da fatura consolidada foi registrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: [FATURAS_QUERY_KEY, user?.tenantId, variables.cartaoId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["contas"] }); // Abate o saldo da conta destino do pagamento
    },
    onError: (error: any) => {
      toast.error("Erro no Pagamento", error.response?.data?.message || "Não foi possível liquidar a fatura.");
    }
  });
}
