"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard,
  Activity
} from "lucide-react";

export default function DashboardPage() {
  const { data: dashboardData, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard");
      return data.data;
    }
  });

  const { data: transactionsPage, isLoading: loadingTx } = useQuery({
    queryKey: ["dashboard-recent-tx"],
    queryFn: async () => {
      const { data } = await api.get("/transacoes?size=5&sort=data,desc");
      return data.data; // Page object, typically has .content
    }
  });

  const summary = dashboardData || {
    saldoTotal: 0,
    mesAtual: { receitas: 0, despesas: 0 },
    contasAPagar: { total: 0 }
  };

  const recentTransactions = transactionsPage?.content || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      const date = new Date(dateStr + "T12:00:00Z"); // Fix timezone offsets for strict ISO dates
      return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Visão geral financeira do mês atual
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-panel border-l-4 border-l-primary hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Em Contas</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-[120px] bg-white/10" />
              ) : (
                <div className="text-2xl font-bold text-white neon-text">{formatCurrency(summary.saldoTotal)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Saldo consolidado</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-l-green-500 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-[120px] bg-white/10" />
              ) : (
                <div className="text-2xl font-bold text-green-400">{formatCurrency(summary.mesAtual?.receitas || 0)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Acumulado no mês atual</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-l-destructive hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-[120px] bg-white/10" />
              ) : (
                <div className="text-2xl font-bold text-red-400">{formatCurrency(summary.mesAtual?.despesas || 0)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Acumulado no mês atual</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-l-yellow-500 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Abertas</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-[120px] bg-white/10" />
              ) : (
                <div className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.contasAPagar?.total || 0)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Total a pagar</p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout for charts / recent list */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Chart Placeholder */}
          <Card className="glass-panel col-span-4 h-[400px]">
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Receitas vs Despesas (Visão Geral)</CardDescription>
            </CardHeader>
            <CardContent className="h-full flex items-center justify-center">
               <div className="text-center text-muted-foreground flex flex-col items-center">
                 <Activity size={48} className="text-primary/50 mb-4 animate-pulse" />
                 <p>Gráfico de área será renderizado aqui com Recharts</p>
                 <p className="text-sm">Implementação nas próximas fases</p>
               </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="glass-panel col-span-3 h-[400px] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Últimas Movimentações</CardTitle>
              <CardDescription>Transações recentes de todas as contas</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
              {loadingTx ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full bg-white/10" />
                        <Skeleton className="h-3 w-1/2 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-border/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${tx.tipo === 'RECEITA' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                          {tx.tipo === 'RECEITA' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[150px] sm:max-w-[200px]">{tx.descricao}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(tx.data)}</span>
                            <span>•</span>
                            <span className="truncate">{tx.categoria?.nome || 'Sem Categoria'}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ml-2 shrink-0 ${tx.tipo === 'RECEITA' ? 'text-green-400' : 'text-white'}`}>
                        {tx.tipo === 'RECEITA' ? '+' : ''}{formatCurrency(tx.valor)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma movimentação recente encontrada.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
