import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OrcamentosService } from "../services/orcamentos.service";
import { OrcamentoRequest } from "../types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function useCriarOrcamentoMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (request: OrcamentoRequest) => OrcamentosService.criar(request),
    onSuccess: (data, request) => {
      // Invalidate both lists
      queryClient.invalidateQueries({ queryKey: ["orcamentos-resumo", user?.id, request.mes, request.ano] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos", user?.id, request.mes, request.ano] });
      toast.success("Orçamento estipulado com sucesso!");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Erro ao definir meta";
      toast.error(msg);
    }
  });
}

export function useAtualizarOrcamentoMutation(mes: number, ano: number) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: OrcamentoRequest }) => 
      OrcamentosService.atualizar(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos-resumo", user?.id, mes, ano] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos", user?.id, mes, ano] });
      toast.success("Limite de gasto atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar o orçamento")
  });
}

export function useDeletarOrcamentoMutation(mes: number, ano: number) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: number) => OrcamentosService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos-resumo", user?.id, mes, ano] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos", user?.id, mes, ano] });
      toast.success("Orçamento removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover orçamento")
  });
}
