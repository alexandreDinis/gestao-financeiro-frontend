import { useQuery } from "@tanstack/react-query";
import { DividasService } from "../services/dividas.service";
import { TipoDivida } from "../types";
import { useAuth } from "@/hooks/use-auth";

export const DIVIDAS_QUERY_KEY = "dividas";

export function useDividasQuery(tipo?: TipoDivida) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId, { tipo }],
    queryFn: () => DividasService.listar(tipo),
    enabled: !!user?.tenantId,
  });
}

export function useDividaQuery(id: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [DIVIDAS_QUERY_KEY, user?.tenantId, id],
    queryFn: () => DividasService.buscarPorId(id),
    enabled: !!user?.tenantId,
  });
}
