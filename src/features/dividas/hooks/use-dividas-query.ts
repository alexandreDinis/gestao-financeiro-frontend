import { useQuery } from "@tanstack/react-query";
import { DividasService } from "../services/dividas.service";
import { TipoDivida, StatusDivida } from "../types";
import { useAuth } from "@/hooks/use-auth";

export const DIVIDAS_QUERY_KEY = "dividas";

export function useDividasQuery(tipo?: TipoDivida, pessoaId?: number, ano?: number, mes?: number, status?: StatusDivida) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId, { tipo, pessoaId, ano, mes, status }],
    queryFn: () => DividasService.listar(tipo, pessoaId, ano, mes, status),
    enabled: !!user?.tenantId,
  });
}

export function useDividaQuery(id: number, options?: any) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId, id],
    queryFn: () => DividasService.buscarPorId(id),
    enabled: !!user?.tenantId && !!id && id !== 0,
    ...options
  });
}
