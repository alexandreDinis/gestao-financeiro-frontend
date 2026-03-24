import { useQuery } from "@tanstack/react-query";
import { PessoasService } from "../services/pessoas.service";
import { useAuth } from "@/hooks/use-auth";

export const PESSOAS_QUERY_KEY = "pessoas";

export function usePessoasQuery() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [PESSOAS_QUERY_KEY, user?.tenantId],
    queryFn: PessoasService.listar,
    enabled: !!user?.tenantId,
  });
}

export function usePessoaQuery(id: number, options?: { enabled?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [PESSOAS_QUERY_KEY, user?.tenantId, id],
    queryFn: () => PessoasService.buscarPorId(id),
    enabled: !!user?.tenantId && (options?.enabled ?? true),
  });
}
