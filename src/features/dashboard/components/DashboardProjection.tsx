"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { ProjecaoMes } from "@/types";

interface Props {
  projecao?: ProjecaoMes;
  loading: boolean;
}

export function DashboardProjection({ projecao, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (loading) {
    return (
        <Card className="glass-panel border-t-4 border-t-primary/30">
            <CardHeader>
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
                ))}
            </CardContent>
        </Card>
    );
  }

  if (!projecao) return null;

  const diasRestantes = projecao.diasTotais - projecao.diasDecorridos;

  return (
    <Card className="glass-panel border-t-4 border-t-primary hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Zap size={18} className="text-primary fill-primary/20" />
            Smart Projection
        </CardTitle>
        <CardDescription>Baseado na tendência do mês atual</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Saldo Projetado (Fim do Mês)</p>
            <p className={`text-xl font-bold mt-1 ${projecao.saldoProjetado >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(projecao.saldoProjetado)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Receitas Projetadas</p>
            <div className="flex items-center gap-2 mt-1">
                <TrendingUp size={16} className="text-green-500" />
                <p className="text-xl font-bold text-green-400">{formatCurrency(projecao.receitasProjetadas)}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Despesas Projetadas</p>
             <div className="flex items-center gap-2 mt-1">
                <TrendingDown size={16} className="text-red-500" />
                <p className="text-xl font-bold text-red-400">{formatCurrency(projecao.despesasProjetadas)}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Timeline Mensal</p>
            <div className="flex items-center gap-2 mt-1">
                <Calendar size={16} className="text-muted-foreground" />
                <p className="text-sm font-bold text-white">{diasRestantes} dias para fechar o mês</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
