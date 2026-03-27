import { useQuery } from "@tanstack/react-query";
import { OrcamentosService } from "../services/orcamentos.service";
import { useAuth } from "@/hooks/use-auth";

export function useOrcamentosResumoQuery(mes: number, ano: number) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["orcamentos-resumo", user?.id, mes, ano],
    queryFn: () => OrcamentosService.resumo(mes, ano),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useOrcamentosQuery(mes: number, ano: number) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["orcamentos", user?.id, mes, ano],
    queryFn: () => OrcamentosService.listar(mes, ano),
    enabled: !!user,
  });
}
