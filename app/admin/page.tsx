"use client";

import { useAdminDashboard } from "@/hooks/use-admin";
import { Building2, Activity, DollarSign } from "lucide-react";

export default function SaaSAdminPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-[#Eab308] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg border-red-500/30">
        <p className="text-red-400 font-medium">Erro ao carregar o dashboard do SaaS. A API pode estar indisponível.</p>
      </div>
    );
  }

  const metrics = data || { totalTenants: 0, tenantsAtivos: 0, mrrTotal: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Visão <span className="text-[#Eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">Global</span></h2>
        <p className="text-muted-foreground">Monitore o crescimento, receita e saúde do seu produto SaaS financeiro em tempo real.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Tenants */}
        <div className="glass-panel rounded-xl p-6 border-border/40 hover:border-[#Eab308]/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 size={80} className="text-[#Eab308]" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total de Clientes (Tenants)</h3>
            <Building2 className="h-4 w-4 text-[#Eab308]" />
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-white glow-text">{metrics.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-2">Empresas registradas na plataforma</p>
          </div>
        </div>

        {/* Tenants Ativos */}
        <div className="glass-panel rounded-xl p-6 border-border/40 hover:border-green-500/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} className="text-green-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Instâncias Ativas</h3>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">{metrics.tenantsAtivos}</div>
            <p className="text-xs text-muted-foreground mt-2">Clientes que fecharam o mês operando</p>
          </div>
        </div>

        {/* MRR Total */}
        <div className="glass-panel rounded-xl p-6 border-border/40 hover:border-blue-500/50 transition-colors relative overflow-hidden group md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} className="text-blue-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">MRR Total</h3>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.mrrTotal)}
            </div>
            <p className="text-xs text-[#Eab308] mt-2 font-medium">Monthly Recurring Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
