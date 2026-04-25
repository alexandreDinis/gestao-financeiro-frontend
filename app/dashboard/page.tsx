"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Activity } from "lucide-react";
import { DashboardResponse } from "@/types";

// V2 Components
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardFlowChart } from "@/features/dashboard/components/DashboardFlowChart";
import { DashboardCategoryChart } from "@/features/dashboard/components/DashboardCategoryChart";
import { DashboardAlerts } from "@/features/dashboard/components/DashboardAlerts";
import { DashboardRecentTransactions } from "@/features/dashboard/components/DashboardRecentTransactions";
import { DashboardBudgets } from "@/features/dashboard/components/DashboardBudgets";
import { DashboardCreditCards } from "@/features/dashboard/components/DashboardCreditCards";
import { DashboardProjection } from "@/features/dashboard/components/DashboardProjection";


export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["dashboard-v2"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard");
      return data.data;
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Financeiro Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Activity size={16} className="text-primary" />
              Visão geral de alta performance • V2
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
               <p className="text-xs text-muted-foreground uppercase tracking-widest">Data de Referência</p>
               <p className="text-sm font-bold text-white">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())}</p>
            </div>

          </div>
        </div>

        {/* 1. Alerts Section (Priority) */}
        {dashboard?.alertas && dashboard.alertas.length > 0 && (
            <DashboardAlerts alertas={dashboard.alertas} loading={isLoading} />
        )}

        {/* 2. Projections Section */}
        <DashboardProjection projecao={dashboard?.projecao} loading={isLoading} />

        {/* 3. Metric Cards (Summary) */}
        <DashboardMetricCards 
          saldoTotal={dashboard?.saldoTotal || 0} 
          mesAtual={dashboard?.mesAtual}
          comparativo={dashboard?.comparativo} 
          loading={isLoading} 
        />

        {/* 4. Main Content Grid (Charts & Budgets) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Charts Column */}
          <div className="col-span-4 space-y-6">
            <DashboardFlowChart data={dashboard?.fluxoCaixaSeisMeses || []} loading={isLoading} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCategoryChart data={dashboard?.gastosPorCategoria || []} loading={isLoading} />
                <DashboardCreditCards cartoes={dashboard?.cartoes || []} loading={isLoading} />
            </div>
          </div>

          {/* Secondary Column (Transactions & Budgets) */}
          <div className="col-span-3 space-y-6">
             <DashboardRecentTransactions 
                recentes={dashboard?.ultimasTransacoes || []} 
                proximos={dashboard?.proximosVencimentos?.proximos30Dias || []} 
                loading={isLoading} 
             />
             <DashboardBudgets orcamentos={dashboard?.orcamentos || []} loading={isLoading} />
          </div>

        </div>

        {/* Footer info or Metas section if needed */}
        {dashboard?.metas && dashboard.metas.length > 0 && (
           <div className="mt-8 border-t border-white/5 pt-8">
              <h3 className="text-lg font-bold text-white mb-4">Minhas Metas Financeiras</h3>
              <div className="grid gap-4 md:grid-cols-3">
                 {dashboard.metas.map((meta, i) => (
                    <div key={i} className="glass-panel p-4 flex items-center justify-between border-l-4 border-primary/40">
                       <div>
                          <p className="text-sm font-bold text-white">{meta.nome}</p>
                          <p className="text-xs text-muted-foreground">Status: {meta.atrasada ? 'Atrasada' : 'No prazo'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-primary">{meta.percentualConcluido.toFixed(0)}%</p>
                          <p className="text-[10px] text-muted-foreground">R$ {meta.valorAtual.toLocaleString()}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </AppLayout>
  );
}

