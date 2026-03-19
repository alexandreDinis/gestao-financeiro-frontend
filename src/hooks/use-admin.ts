import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "@/lib/toast";

export interface TenantAdminResponse {
  id: number;
  nome: string;
  subdominio: string;
  status: "ATIVO" | "BLOQUEADO" | "CANCELADO";
  createdAt: string; // ISO date
  plano: string;
  mrr: number; // Monthly Recurring Revenue
}

export interface TenantCreateRequest {
  tenantNome: string;
  subdominio: string;
  planoId: number;
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}

export interface AdminDashboardMetrics {
  totalTenants: number;
  tenantsAtivos: number;
  mrrTotal: number;
}

// 1. Fetching (Queries)
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data.data as AdminDashboardMetrics;
    },
  });
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: async () => {
      // Basic pagination without filters for MVP
      const { data } = await api.get("/admin/tenants?page=0&size=50");
      return data.data.content as TenantAdminResponse[];
    },
  });
}

// 2. Mutations
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TenantCreateRequest) => {
      const { data } = await api.post("/admin/tenants", request);
      return data.data;
    },
    onSuccess: () => {
      toast.success("Tenant Provisionado!", "A nova instância foi criada e configurada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: any) => {
      toast.error("Erro no Provisionamento", error.response?.data?.message || "Ocorreu um erro ao criar o Tenant.");
    }
  });
}

export function useAdminBloquearTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: number) => {
      await api.put(`/admin/tenants/${tenantId}/bloquear`);
    },
    onSuccess: () => {
      toast.warning("Tenant Bloqueado", "O acesso dessa empresa ao SaaS foi suspenso.");
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
    },
    onError: () => {
      toast.error("Erro", "Não foi possível bloquear o tenant.");
    }
  });
}

export function useAdminDesbloquearTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: number) => {
      await api.put(`/admin/tenants/${tenantId}/desbloquear`);
    },
    onSuccess: () => {
      toast.success("Tenant Desbloqueado", "O acesso foi restabelecido.");
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
    },
    onError: () => {
      toast.error("Erro", "Não foi possível desbloquear o tenant.");
    }
  });
}
