import { useQuery } from "@tanstack/react-query";
import { CartoesService } from "../services/cartoes.service";
import { useAuth } from "@/hooks/use-auth";

export const CARTOES_QUERY_KEY = "cartoes";
export const FATURAS_QUERY_KEY = "faturas";

export function useCartoesQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [CARTOES_QUERY_KEY, user?.tenantId],
    queryFn: CartoesService.listar,
    enabled: !!user,
  });
}

export function useCartaoQuery(id: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [CARTOES_QUERY_KEY, user?.tenantId, id],
    queryFn: () => CartoesService.buscar(id),
    enabled: !!user && !!id,
  });
}

export function useFaturasQuery(cartaoId: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [FATURAS_QUERY_KEY, user?.tenantId, cartaoId],
    queryFn: () => CartoesService.listarFaturas(cartaoId),
    enabled: !!user && !!cartaoId,
  });
}

export function useFaturaQuery(faturaId: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [FATURAS_QUERY_KEY, user?.tenantId, 'detail', faturaId],
    queryFn: () => CartoesService.buscarFatura(faturaId),
    enabled: !!user && !!faturaId,
  });
}
