"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard,
  Activity
} from "lucide-react";

// Mock Data for Dashboard until backend is connected
const MOCK_SUMMARY = {
  saldoTotal: 15420.50,
  receitasMes: 8500.00,
  despesasMes: -3240.80,
  faturasAbertas: -1250.00
};

const MOCK_RECENT_TRANSACTIONS = [
  { id: 1, descricao: "Salário Mensal", valor: 8500.00, tipo: "RECEITA", data: "2026-03-05", categoria: "Renda Fixa" },
  { id: 2, descricao: "Mercado Assaí", valor: -450.30, tipo: "DESPESA", data: "2026-03-08", categoria: "Alimentação" },
  { id: 3, descricao: "Conta de Luz", valor: -180.50, tipo: "DESPESA", data: "2026-03-10", categoria: "Moradia" },
  { id: 4, descricao: "Uber", valor: -45.00, tipo: "DESPESA", data: "2026-03-11", categoria: "Transporte" },
];

export default function DashboardPage() {
  // Real implementation for later:
  // const { data: summary, isLoading: loadingSummary } = useQuery({
  //   queryKey: ["dashboard-summary"],
  //   queryFn: async () => {
  //     const { data } = await api.get("/relatorios/dashboard");
  //     return data;
  //   }
  // });

  const summary = MOCK_SUMMARY;
  const recentTransactions = MOCK_RECENT_TRANSACTIONS;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
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
              <div className="text-2xl font-bold text-white neon-text">{formatCurrency(summary.saldoTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">Saldo consolidado</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-l-green-500 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(summary.receitasMes)}</div>
              <p className="text-xs text-muted-foreground mt-1">+12% em relação ao mês anterior</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-l-destructive hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(summary.despesasMes)}</div>
              <p className="text-xs text-muted-foreground mt-1">-5% em relação ao mês anterior</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-l-4 border-l-yellow-500 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Abertas</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.faturasAbertas)}</div>
              <p className="text-xs text-muted-foreground mt-1">Vencimento próximo: 15/03</p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout for charts / recent list */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Chart Placeholder */}
          <Card className="glass-panel col-span-4 h-[400px]">
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Receitas vs Despesas (Últimos 6 meses)</CardDescription>
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
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-border/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.tipo === 'RECEITA' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                        {tx.tipo === 'RECEITA' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tx.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{tx.data}</span>
                          <span>•</span>
                          <span>{tx.categoria}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold ${tx.tipo === 'RECEITA' ? 'text-green-400' : 'text-white'}`}>
                      {tx.tipo === 'RECEITA' ? '+' : ''}{formatCurrency(tx.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
