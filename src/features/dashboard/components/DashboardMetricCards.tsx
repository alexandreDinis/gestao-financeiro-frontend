"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { ComparativoMes, ResumoMes } from "@/types";

interface Props {
  saldoTotal: number;
  mesAtual?: ResumoMes;
  comparativo?: ComparativoMes;
  loading: boolean;
}

export function DashboardMetricCards({ saldoTotal, mesAtual, comparativo, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const renderVariacao = (percentual: number) => {
    if (!percentual || percentual === 0) return null;
    
    const isPositive = percentual > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-400" : "text-red-400";

    return (
      <span className={`text-[10px] flex items-center gap-1 mt-1 ${color}`}>
        <Icon size={12} />
        {Math.abs(percentual).toFixed(1)}% vs mês ant.
      </span>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-panel border-l-4 border-l-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px] bg-white/10" />
              <Skeleton className="h-4 w-4 rounded-full bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] bg-white/10" />
              <Skeleton className="h-3 w-[80px] mt-2 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Saldo Total */}
      <Card className="glass-panel border-l-4 border-l-primary hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Consolidado</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white neon-text">{formatCurrency(saldoTotal)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total em todas as contas</p>
        </CardContent>
      </Card>

      {/* Receitas */}
      <Card className="glass-panel border-l-4 border-l-green-500 hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(mesAtual?.receitas || 0)}</div>
          {comparativo && renderVariacao(comparativo.variacaoReceitasPercent)}
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card className="glass-panel border-l-4 border-l-red-500 hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(mesAtual?.despesas || 0)}</div>
          {comparativo && renderVariacao(comparativo.variacaoDespesasPercent)}
        </CardContent>
      </Card>

      {/* Saldo Mensal */}
      <Card className="glass-panel border-l-4 border-l-yellow-500 hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balanço Mensal</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(mesAtual?.saldo || 0) >= 0 ? "text-yellow-400" : "text-red-400"}`}>
            {formatCurrency(mesAtual?.saldo || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-[10px]">Resultado líquido do mês</p>
        </CardContent>
      </Card>
    </div>
  );
}
