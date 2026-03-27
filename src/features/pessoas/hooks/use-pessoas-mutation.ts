import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PessoasService } from "../services/pessoas.service";
import { PESSOAS_QUERY_KEY } from "./use-pessoas-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/lib/toast";

export function useCriarPessoaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: PessoasService.criar,
    onSuccess: () => {
      toast.success("Pessoa Criada", "O contato foi registrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível criar a pessoa.");
    }
  });
}

export function useAtualizarPessoaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: any }) => PessoasService.atualizar(id, request),
    onSuccess: (_, variables) => {
      toast.success("Pessoa Atualizada", "Os dados do contato foram salvos.");
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] });
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId, variables.id] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível atualizar a pessoa.");
    }
  });
}

export function useDeletarPessoaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: PessoasService.deletar,
    onSuccess: () => {
      toast.success("Pessoa Excluída", "O contato foi removido com sucesso.");
      queryClient.invalidateQueries({ queryKey: [PESSOAS_QUERY_KEY, user?.tenantId] });
    },
    onError: (error: any) => {
      toast.error("Erro", error.response?.data?.message || "Não foi possível excluir (verifique se há dívidas atreladas).");
    }
  });
}
